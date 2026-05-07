import PDFDocument from 'pdfkit';
import { InferSelectModel } from 'drizzle-orm';
import { report, evidenceAsset } from '../db/schema.js';

type ReportWithEvidence = InferSelectModel<typeof report> & {
  evidenceAssets: InferSelectModel<typeof evidenceAsset>[];
};

export function generateReportPdf(
  doc: InstanceType<typeof PDFDocument>,
  data: ReportWithEvidence,
) {
  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  // Header
  doc.fontSize(18).font('Helvetica-Bold').text('LAPORAN SAFESPACE', {
    align: 'center',
  });
  doc.fontSize(12).font('Helvetica').text(data.reportCode, { align: 'center' });
  doc.moveDown(1.5);

  // Meta info
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Tanggal Dibuat: ', { continued: true })
    .font('Helvetica')
    .text(formatDate(data.createdAt));

  doc
    .font('Helvetica-Bold')
    .text('Status: ', { continued: true })
    .font('Helvetica')
    .text(data.status);

  doc.moveDown(1);
  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();
  doc.moveDown(1);

  // Detail laporan
  const fields: { label: string; value: string }[] = [
    { label: 'Jenis Insiden', value: data.incident },
    { label: 'Tanggal Kejadian', value: formatDate(data.date) },
    { label: 'Lokasi', value: data.location },
    { label: 'Deskripsi Insiden', value: data.incidentDesc },
    { label: 'Deskripsi Pelaku', value: data.perpetratorDesc },
  ];

  for (const field of fields) {
    doc.fontSize(10).font('Helvetica-Bold').text(field.label);
    doc.fontSize(10).font('Helvetica').text(field.value, { indent: 12 });
    doc.moveDown(0.8);
  }

  // Daftar bukti
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica-Bold').text('Bukti yang Dilampirkan');

  if (data.evidenceAssets.length === 0) {
    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Tidak ada bukti dilampirkan.', { indent: 12 });
  } else {
    data.evidenceAssets.forEach((asset, i) => {
      const fileName = asset.evidencePath.split('/').pop() ?? asset.evidencePath;
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`${i + 1}. ${fileName}`, { indent: 12 });
    });
  }
}
