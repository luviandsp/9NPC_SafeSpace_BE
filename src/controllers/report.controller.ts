import { Request, Response, NextFunction } from 'express';
import PDFDocument from 'pdfkit';
import { db } from '../db/index.js';
import { report, evidenceAsset, reportStatusHistory, user as userTable, admin as adminTable } from '../db/schema.js';
import { nanoid } from 'nanoid';
import supabase from '../config/supabase.js';
import { and, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { generateReportPdf } from '../utils/pdf.utils.js';
import { recordStatusHistory } from '../utils/history.utils.js';
import { createNotificationsForAdmins } from '../utils/notification.utils.js';
import {
  addEvidenceSchema,
  createReportSchema,
  getAllReportsSchema,
  getReportByIdSchema,
} from '../utils/validators/report.validator.js';

export const createReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const {
    incident,
    date,
    location,
    incidentDesc,
    perpetratorDesc,
    evidencePaths,
  } = createReportSchema.parse(req.body);

  try {
    // Menggunakan transaksi untuk memastikan integritas data
    const [newReport] = await db.transaction(async (tx) => {
      // 1. Masukkan data laporan utama
      const [insertedReport] = await tx
        .insert(report)
        .values({
          userId: req.user!.id,
          reportCode: `RPT-${nanoid(10)}`,
          incident: incident,
          date: date,
          location: location,
          incidentDesc: incidentDesc,
          perpetratorDesc: perpetratorDesc,
        })
        .returning();

      // 2. Siapkan array untuk menampung path permanen
      const permanentPathsData: { reportId: string; evidencePath: string }[] =
        [];

      // 3. Proses pemindahan file dari temp ke permanent jika ada bukti
      if (
        evidencePaths &&
        Array.isArray(evidencePaths) &&
        evidencePaths.length > 0
      ) {
        for (const tempPath of evidencePaths) {
          // Ambil nama file dari path temp (contoh: "temp/123/abcd-foto.jpg" -> "abcd-foto.jpg")
          const fileName = tempPath.split('/').pop();

          // Buat path permanen menggunakan ID laporan agar terorganisir
          const permanentPath = `permanent/${insertedReport.id}/${fileName}`;

          // Lakukan pemindahan (move) di Supabase Storage
          const { error: moveError } = await supabase.storage
            .from('evidence_assets')
            .move(tempPath, permanentPath);

          if (moveError) {
            // Jika ada 1 saja file yang gagal dipindah, lemparkan error.
            // Drizzle akan otomatis me-rollback insert laporan di atas.
            throw new Error(
              `Gagal memindahkan file bukti: ${moveError.message}`,
            );
          }

          // Jika berhasil dipindah, catat path permanennya
          permanentPathsData.push({
            reportId: insertedReport.id,
            evidencePath: permanentPath,
          });
        }

        // 4. Masukkan path PERMANENT yang baru ke tabel evidence_asset
        if (permanentPathsData.length > 0) {
          await tx.insert(evidenceAsset).values(permanentPathsData);
        }
      }

      return [insertedReport];
    });

    await recordStatusHistory({
      reportId: newReport.id,
      oldStatus: null,
      newStatus: 'RECEIVED',
      changedBy: req.user!.id,
      changedByRole: 'USER',
    });

    await createNotificationsForAdmins({
      type: 'NEW_REPORT_SUBMITTED',
      title: 'Laporan Baru Masuk',
      message: `Laporan baru dengan kode ${newReport.reportCode} telah diajukan.`,
      relatedId: newReport.id,
    });

    return res.status(201).json({
      success: true,
      message: 'Laporan berhasil dibuat',
      data: newReport,
    });
  } catch (error) {
    next(error);
  }
};

export const getReportById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = getReportByIdSchema.parse(req.params);
  const userId = req.user!.id;

  try {
    const reportData = await db.query.report.findFirst({
      where: and(eq(report.id, id), eq(report.userId, userId)),
      with: {
        evidenceAssets: true,
      },
    });

    if (!reportData) {
      return res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan atau Anda tidak memiliki akses',
      });
    }

    const pathsToSign = reportData.evidenceAssets.map(
      (asset) => asset.evidencePath,
    );

    let finalEvidenceAssets = reportData.evidenceAssets.map((asset) => ({
      ...asset,
      assetUrl: null as string | null, // Default null untuk TypeScript
    }));

    if (pathsToSign.length > 0) {
      const { data, error } = await supabase.storage
        .from('evidence_assets')
        .createSignedUrls(pathsToSign, 60);

      if (error) {
        console.error('Gagal membuat bulk signed URLs:', error.message);
      } else if (data) {
        finalEvidenceAssets = reportData.evidenceAssets.map((asset) => {
          // Cari data URL dari Supabase yang path-nya cocok
          const matchedUrlData = data.find(
            (d) => d.path === asset.evidencePath,
          );

          return {
            ...asset,
            assetUrl: matchedUrlData?.signedUrl || null,
          };
        });
      }
    }

    const responseData = {
      ...reportData,
      evidenceAssets: finalEvidenceAssets,
    };

    return res.status(200).json({
      success: true,
      message: 'Laporan berhasil diambil',
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllReports = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { page, limit, search } = getAllReportsSchema.parse(req.query);

  const userId = req.user!.id;
  const offset = (page - 1) * limit;

  const searchTerm = search ? `%${search}%` : null;
  const whereClause = searchTerm
    ? and(
        eq(report.userId, userId),
        or(
          ilike(report.incident, searchTerm),
          ilike(report.incidentDesc, searchTerm),
        ),
      )
    : eq(report.userId, userId);

  try {
    const reports = await db.query.report.findMany({
      where: whereClause,
      limit: limit,
      offset: offset,
      orderBy: (reports, { desc }) => [desc(reports.createdAt)],
      with: {
        evidenceAssets: true,
      },
    });

    const [totalResult] = await db
      .select({ count: sql<number>`cast(count(${report.id}) as int)` })
      .from(report)
      .where(whereClause);

    const total = totalResult.count;
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      message: 'Laporan berhasil diambil',
      data: reports,
      pagination: {
        size: limit,
        page: page,
        total: total,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const downloadReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = getReportByIdSchema.parse(req.params);

  try {
    const reportData = await db.query.report.findFirst({
      where: eq(report.id, id),
      with: { evidenceAssets: true },
    });

    if (!reportData) {
      return res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan',
      });
    }

    const isOwner = reportData.userId === req.user!.id;
    const isAdmin = req.user!.user_metadata?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke laporan ini',
      });
    }

    const safeCode = reportData.reportCode.replace(/[^a-zA-Z0-9-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="laporan-${safeCode}.pdf"`,
    );

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    generateReportPdf(doc, reportData);
    doc.end();
  } catch (error) {
    next(error);
  }
};

export const addEvidence = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = getReportByIdSchema.parse(req.params);
  const { evidencePaths } = addEvidenceSchema.parse(req.body);

  try {
    const existingReport = await db.query.report.findFirst({
      where: eq(report.id, id),
    });

    if (!existingReport) {
      return res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan',
      });
    }

    if (existingReport.userId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke laporan ini',
      });
    }

    const newEvidenceData: { reportId: string; evidencePath: string }[] = [];

    for (const tempPath of evidencePaths) {
      const fileName = tempPath.split('/').pop();
      const permanentPath = `permanent/${id}/${fileName}`;

      const { error: moveError } = await supabase.storage
        .from('evidence_assets')
        .move(tempPath, permanentPath);

      if (moveError) {
        throw new Error(`Gagal memindahkan file bukti: ${moveError.message}`);
      }

      newEvidenceData.push({ reportId: id, evidencePath: permanentPath });
    }

    await db.insert(evidenceAsset).values(newEvidenceData);

    const updatedReport = await db.query.report.findFirst({
      where: eq(report.id, id),
      with: { evidenceAssets: true },
    });

    return res.status(200).json({
      success: true,
      message: 'Bukti berhasil ditambahkan',
      data: updatedReport,
    });
  } catch (error) {
    next(error);
  }
};

export const getReportHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = getReportByIdSchema.parse(req.params);

  try {
    const existingReport = await db.query.report.findFirst({
      where: eq(report.id, id),
    });

    if (!existingReport) {
      return res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan',
      });
    }

    const isOwner = existingReport.userId === req.user!.id;
    const isAdmin = req.user!.user_metadata?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke laporan ini',
      });
    }

    const history = await db
      .select()
      .from(reportStatusHistory)
      .where(eq(reportStatusHistory.reportId, id))
      .orderBy(sql`${reportStatusHistory.createdAt} desc`);

    const changedByIds = [
      ...new Set(history.map((h) => h.changedBy).filter(Boolean) as string[]),
    ];

    const nameMap = new Map<string, string>();

    if (changedByIds.length > 0) {
      const [users, admins] = await Promise.all([
        db
          .select({ id: userTable.id, name: userTable.name })
          .from(userTable)
          .where(inArray(userTable.id, changedByIds)),
        db
          .select({ id: adminTable.id, name: adminTable.name })
          .from(adminTable)
          .where(inArray(adminTable.id, changedByIds)),
      ]);

      for (const u of users) {
        if (u.name) nameMap.set(u.id, u.name);
      }
      for (const a of admins) {
        if (a.name) nameMap.set(a.id, a.name);
      }
    }

    const data = history.map((h) => ({
      ...h,
      changedByName: h.changedBy ? (nameMap.get(h.changedBy) ?? null) : null,
    }));

    return res.status(200).json({
      success: true,
      message: 'Riwayat status laporan berhasil diambil',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = getReportByIdSchema.parse(req.params);
  const userId = req.user!.id;

  try {
    const existingReport = await db.query.report.findFirst({
      where: and(eq(report.id, id), eq(report.userId, userId)),
    });

    if (!existingReport) {
      return res.status(404).json({
        success: false,
        message: 'Laporan tidak ditemukan atau Anda tidak memiliki akses',
      });
    }

    if (existingReport.status !== 'CANCELLED') {
      await db
        .update(report)
        .set({ status: 'CANCELLED' })
        .where(eq(report.id, id));

      await recordStatusHistory({
        reportId: id,
        oldStatus: existingReport.status,
        newStatus: 'CANCELLED',
        changedBy: userId,
        changedByRole: 'USER',
      });

      await createNotificationsForAdmins({
        type: 'REPORT_CANCELLED',
        title: 'Laporan Dibatalkan',
        message: `Laporan dengan kode ${existingReport.reportCode} telah dibatalkan oleh pelapor.`,
        relatedId: id,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Laporan berhasil dibatalkan',
    });
  } catch (error) {
    next(error);
  }
};
