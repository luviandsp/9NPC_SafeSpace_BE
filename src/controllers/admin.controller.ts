import { Request, Response, NextFunction } from 'express';
import {
  getAllReportsSchema,
  getReportByIdSchema,
  updateStatusReportSchema,
} from '../utils/validators/report.validator.js';
import { db } from '../db/index.js';
import { report } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import supabase from '../config/supabase.js';

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

export const updateStatusReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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

    await db.update(report).set({ status: status }).where(eq(report.id, id));

    return res.status(200).json({
      success: true,
      message: 'Status laporan berhasil diperbarui',
    });
  } catch (error) {
    next(error);
  }
};
