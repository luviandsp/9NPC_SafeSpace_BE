import { Request, Response, NextFunction } from 'express';
import {
  getAllReportsSchema,
  getReportByIdSchema,
  updateStatusReportSchema,
} from '../utils/validators/report.validator.js';
import { db } from '../db/index.js';
import { report, admin } from '../db/schema.js';
import { eq, sql, count, and, or, ilike, asc, desc } from 'drizzle-orm';
import { recordStatusHistory } from '../utils/history.utils.js';
import { createNotification } from '../utils/notification.utils.js';
import { validateStatusTransition } from '../utils/status-transition.utils.js';
import { createScopedClient } from '../config/supabase.js';
import {
  updateAdminProfileSchema,
  getRecentReportsSchema,
  getAdminReportsSchema,
  updateStatusBodySchema,
} from '../utils/validators/admin.validator.js';
import {
  getStatusLabel,
  CATEGORY_LABELS,
} from '../utils/status-label.utils.js';

export const getAllReports = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { page, limit } = getAllReportsSchema.parse(req.query);
  const offset = (page - 1) * limit;

  try {
    const reports = await db.query.report.findMany({
      limit: limit,
      offset: offset,
      orderBy: (reports, { desc }) => [desc(reports.createdAt)],
      with: {
        evidenceAssets: true,
      },
    });

    const [totalResult] = await db
      .select({ count: sql<number>`cast(count(${report.id}) as int)` })
      .from(report);

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

export const getReportById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = getReportByIdSchema.parse(req.params);

  const token = req.headers.authorization?.split(' ')[1];
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: 'Token tidak valid' });

  const supabaseScoped = createScopedClient(token);

  try {
    const reportData = await db.query.report.findFirst({
      where: eq(report.id, id),
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
      const { data, error } = await supabaseScoped.storage
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

export const updateStatusReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const adminId = req.user!.id;
  const { id } = updateStatusReportSchema.pick({ id: true }).parse(req.params);
  const { status, internalNote } = updateStatusBodySchema.parse(req.body);

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

    const transition = validateStatusTransition(existingReport.status, status);
    if (!transition.valid) {
      return res.status(400).json({
        success: false,
        message: transition.message,
      });
    }

    const [updatedReport] = await db
      .update(report)
      .set({ adminId: adminId, status: status })
      .where(eq(report.id, id))
      .returning();

    await recordStatusHistory({
      reportId: id,
      oldStatus: existingReport.status,
      newStatus: status,
      changedBy: adminId,
      changedByRole: 'ADMIN',
      notes: internalNote,
    });

    await createNotification({
      recipientId: existingReport.userId,
      recipientRole: 'USER',
      type: 'REPORT_STATUS_CHANGED',
      title: 'Status Laporan Diperbarui',
      message: `Status laporan ${existingReport.reportCode} telah diubah menjadi ${status}.`,
      relatedId: id,
    });

    return res.status(200).json({
      success: true,
      message: 'Status laporan berhasil diperbarui',
      data: updatedReport,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const adminId = req.user!.id;

  const token = req.headers.authorization?.split(' ')[1];
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: 'Token tidak valid' });

  const supabaseScoped = createScopedClient(token);

  try {
    const adminData = await db.query.admin.findFirst({
      where: eq(admin.id, adminId),
    });

    if (!adminData) {
      return res.status(404).json({
        success: false,
        message: 'Admin tidak ditemukan',
      });
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [[reportMetrics], { data: urlData, error: urlError }] =
      await Promise.all([
        db
          .select({
            totalReports: count(),
            totalFinishedReports: sql<number>`count(${report.id}) filter (where ${report.status} = 'DONE')::int`,
            weeklyReports: sql<number>`count(${report.id}) filter (where ${report.createdAt} >= ${oneWeekAgo.toISOString()})::int`,
          })
          .from(report),

        adminData.profilePicturePath
          ? supabaseScoped.storage
              .from('profile_pictures')
              .createSignedUrl(adminData.profilePicturePath, 3600)
          : Promise.resolve({ data: null, error: null }),
      ]);

    if (urlError) {
      console.error('Error generating signed URL:', urlError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Profil admin berhasil diambil',
      data: {
        admin: adminData,
        activity: {
          lastLogin: req.user!.last_sign_in_at || null,
          WeeklyReportCount: reportMetrics.weeklyReports,
        },
        report: {
          totalReports: reportMetrics.totalReports,
          totalFinishedReports: reportMetrics.totalFinishedReports,
        },
        profilePictureUrl: urlData?.signedUrl || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const adminId = req.user!.id;
  const { name, unit } = updateAdminProfileSchema.parse(req.body);

  try {
    const existingAdmin = await db.query.admin.findFirst({
      where: eq(admin.id, adminId),
    });

    if (!existingAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Admin tidak ditemukan',
      });
    }

    const [updatedAdmin] = await db
      .update(admin)
      .set({ name, unit })
      .where(eq(admin.id, adminId))
      .returning();

    return res.status(200).json({
      success: true,
      message: 'Profil admin berhasil diperbarui',
      data: updatedAdmin,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)::int`,
        laporanBaru: sql<number>`COUNT(*) FILTER (WHERE ${report.createdAt} >= NOW() - INTERVAL '48 hours')::int`,
        direview: sql<number>`COUNT(*) FILTER (WHERE ${report.status} = 'REVIEW')::int`,
        selesai: sql<number>`COUNT(*) FILTER (WHERE ${report.status} = 'DONE')::int`,
        excluded: sql<number>`COUNT(*) FILTER (WHERE ${report.status} IN ('REJECTED', 'CANCELLED'))::int`,
      })
      .from(report);

    const denominator = stats.total - stats.excluded;
    const completionRate =
      denominator > 0
        ? parseFloat(((stats.selesai / denominator) * 100).toFixed(2))
        : 0;

    return res.status(200).json({
      success: true,
      message: 'Statistik dashboard berhasil diambil',
      data: {
        totalLaporan: {
          count: stats.total,
          label: 'Sejak platform aktif',
        },
        laporanBaru: {
          count: stats.laporanBaru,
          label: `${stats.laporanBaru} laporan dalam 48 jam terakhir`,
          sinceHours: 48,
        },
        direview: {
          count: stats.direview,
          label: 'Perlu tindakan',
        },
        selesai: {
          count: stats.selesai,
          completionRate,
          label: `Penyelesaian ${completionRate}%`,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const ALL_CATEGORIES = [
  'KEKERASAN_SEKSUAL',
  'KEKERASAN_VERBAL',
  'KEKERASAN_FISIK',
  'LAINNYA',
] as const;

export const getDashboardCategories = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const rows = await db
      .select({
        category: report.category,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(report)
      .groupBy(report.category);

    const total = rows.reduce((sum, r) => sum + r.count, 0);
    const countMap = new Map(rows.map((r) => [r.category, r.count]));

    const categories = ALL_CATEGORIES.map((key) => {
      const count = countMap.get(key) ?? 0;
      return {
        key,
        label: CATEGORY_LABELS[key],
        count,
        percentage:
          total > 0 ? parseFloat(((count / total) * 100).toFixed(2)) : 0,
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Kategori laporan berhasil diambil',
      data: { total, categories },
    });
  } catch (error) {
    next(error);
  }
};

export const getRecentReports = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { limit } = getRecentReportsSchema.parse(req.query);

  try {
    const rows = await db
      .select({
        id: report.id,
        reportCode: report.reportCode,
        incident: report.incident,
        category: report.category,
        submittedAt: report.createdAt,
        status: report.status,
      })
      .from(report)
      .orderBy(desc(report.createdAt))
      .limit(limit);

    const data = rows.map((r) => ({
      ...r,
      reporterDisplay: 'Anonim',
      statusLabel: getStatusLabel(r.status),
    }));

    return res.status(200).json({
      success: true,
      message: 'Laporan terbaru berhasil diambil',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminReports = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const {
    page,
    limit,
    search,
    status: statusFilter,
    category,
    sortOrder,
  } = getAdminReportsSchema.parse(req.query);

  const offset = (page - 1) * limit;
  const orderByClause =
    sortOrder === 'asc' ? asc(report.createdAt) : desc(report.createdAt);

  const whereClause = and(
    search
      ? or(
          ilike(report.incident, `%${search}%`),
          ilike(report.incidentDesc, `%${search}%`),
        )
      : undefined,
    statusFilter ? eq(report.status, statusFilter) : undefined,
    category ? eq(report.category, category) : undefined,
  );

  try {
    const [rows, [totalResult]] = await Promise.all([
      db
        .select()
        .from(report)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset),
      db
        .select({
          count: sql<number>`cast(count(${report.id}) as int)`,
        })
        .from(report)
        .where(whereClause),
    ]);

    const total = totalResult.count;
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      message: 'Laporan berhasil diambil',
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};
