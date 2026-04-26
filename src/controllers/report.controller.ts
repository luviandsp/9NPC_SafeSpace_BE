import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.js';
import { report, evidenceAsset } from '../db/schema.js';
import { nanoid } from 'nanoid';
import supabase from '../config/supabase.js';
import { and, eq, sql } from 'drizzle-orm';
import {
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
      signedUrl: null as string | null, // Default null untuk TypeScript
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
            signedUrl: matchedUrlData?.signedUrl || null,
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
  const { page, limit } = getAllReportsSchema.parse(req.query);

  const userId = req.user!.id;
  const offset = (page - 1) * limit;

  try {
    const reports = await db.query.report.findMany({
      where: eq(report.userId, userId),
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
      .where(eq(report.userId, userId));

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

    await db
      .update(report)
      .set({ status: 'CANCELLED' })
      .where(eq(report.id, id));

    return res.status(200).json({
      success: true,
      message: 'Laporan berhasil dibatalkan',
    });
  } catch (error) {
    next(error);
  }
};
