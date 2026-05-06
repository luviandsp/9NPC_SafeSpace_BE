import { Request, Response, NextFunction } from 'express';
import {
  getAllReportsSchema,
  getReportByIdSchema,
  updateStatusReportSchema,
} from '../utils/validators/report.validator.js';
import { db } from '../db/index.js';
import { report, admin } from '../db/schema.js';
import { eq, sql, count } from 'drizzle-orm';
import { recordStatusHistory } from '../utils/history.utils.js';
import supabase from '../config/supabase.js';
import { updateAdminProfileSchema } from '../utils/validators/admin.validator.js';

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

export const updateStatusReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const adminId = req.user!.id;
  const { id } = updateStatusReportSchema.pick({ id: true }).parse(req.params);
  const { status } = updateStatusReportSchema
    .pick({ status: true })
    .parse(req.body);

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

    if (existingReport.status === status) {
      return res.status(200).json({
        success: true,
        message: 'Status laporan tidak berubah',
        data: existingReport,
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

    const [
      { data: authUser, error: authError },
      [reportMetrics],
      { data: urlData, error: urlError },
    ] = await Promise.all([
      supabase.auth.getUser(),

      db
        .select({
          totalReports: count(),
          totalFinishedReports: sql<number>`count(${report.id}) filter (where ${report.status} = 'DONE')::int`,
          weeklyReports: sql<number>`count(${report.id}) filter (where ${report.createdAt} >= ${oneWeekAgo.toISOString()})::int`,
        })
        .from(report),

      adminData.profilePicturePath
        ? supabase.storage
            .from('profile_pictures')
            .createSignedUrl(adminData.profilePicturePath, 3600)
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (authError) {
      console.error(
        'Gagal mendapatkan data user dari Supabase:',
        authError.message,
      );
    }

    if (urlError) {
      console.error('Error generating signed URL:', urlError.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Profil admin berhasil diambil',
      data: {
        admin: adminData,
        activity: {
          lastLogin: authUser?.user?.last_sign_in_at || null,
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
