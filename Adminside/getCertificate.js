// backend/routes/admin/certificates.js
const express = require('express');
const router = express.Router();
const { poolPromise } = require('../../db');
const sql = require('mssql');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Helper: Generate certificate PDF and return saved path
 */
async function generateCertificatePDF({ enrollId, studentName, courseName }) {
  const certificatesDir = path.join(__dirname, '../../uploads/certificates');
  if (!fs.existsSync(certificatesDir)) fs.mkdirSync(certificatesDir, { recursive: true });

  const fileName = `certificate_${enrollId}.pdf`;
  const filePath = path.join(certificatesDir, fileName);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(fs.createWriteStream(filePath));

  // Simple certificate template
  doc.fontSize(24).text('🎓 Certificate of Completion', { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(18).text('This certifies that', { align: 'center' });
  doc.moveDown();
  doc.fontSize(22).text(studentName, { align: 'center', underline: true });
  doc.moveDown();
  doc.fontSize(18).text('has successfully completed the course', { align: 'center' });
  doc.moveDown();
  doc.fontSize(20).text(courseName, { align: 'center', underline: true });
  doc.moveDown(2);
  doc.fontSize(14).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'center' });

  doc.end();

  return filePath;
}

/**
 * GET /api/admin/certificates/all
 * Returns all certificate requests with student info
 */
router.get('/all', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        e.EnrollID,
        e.Sid,
        u.FName,
        u.LName,
        e.CourseID,
        c.CourseName,
        e.CertificateStatus,
        e.Certificate,
        e.CertificatePath,
        e.S_Date,
        e.End_Date
      FROM Enroll e
      JOIN [User] u ON u.Uid = e.Sid
      JOIN Course c ON c.CourseID = e.CourseID
      WHERE e.CertificateStatus IS NOT NULL AND e.CertificateStatus <> 'NotRequested'
      ORDER BY e.EnrollID DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching certificate requests:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

/**
 * POST /api/admin/certificates/:enrollId
 * Approve or reject certificate
 * Body: { action: 'approve' | 'reject' }
 */
router.post('/:enrollId', async (req, res) => {
  const { enrollId } = req.params;
  const { action } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Invalid action' });
  }

  const status = action === 'approve' ? 'Issued' : 'Rejected';
  const certificateBit = action === 'approve' ? 1 : 0;

  try {
    const pool = await poolPromise;
    let certificatePath = null;

    if (status === 'Issued') {
      // fetch student & course name
      const rs = await pool.request()
        .input('EnrollID', sql.Int, enrollId)
        .query(`
          SELECT e.EnrollID, u.FName, u.LName, c.CourseName
          FROM Enroll e
          JOIN [User] u ON u.Uid = e.Sid
          JOIN Course c ON c.CourseID = e.CourseID
          WHERE e.EnrollID = @EnrollID
        `);

      const row = rs.recordset[0];
      if (!row) return res.status(404).json({ message: 'Enrollment not found' });

      // generate PDF
      certificatePath = await generateCertificatePDF({
        enrollId: row.EnrollID,
        studentName: `${row.FName} ${row.LName}`,
        courseName: row.CourseName
      });
    }

    // Update database
    await pool.request()
      .input('EnrollID', sql.Int, enrollId)
      .input('CertificateStatus', sql.NVarChar, status)
      .input('Certificate', sql.Bit, certificateBit)
      .input('CertificatePath', sql.NVarChar, certificatePath)
      .query(`
        UPDATE Enroll
        SET CertificateStatus = @CertificateStatus,
            Certificate = @Certificate,
            CertificatePath = @CertificatePath
        WHERE EnrollID = @EnrollID
      `);

    res.json({ message: `Certificate ${status.toLowerCase()} successfully.`, certificatePath });
  } catch (err) {
    console.error('Error updating certificate status:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

/**
 * GET /api/admin/certificates/download/:enrollId
 * Download certificate PDF if exists
 */
router.get('/download/:enrollId', async (req, res) => {
  const { enrollId } = req.params;

  try {
    const pool = await poolPromise;
    const rs = await pool.request()
      .input('EnrollID', sql.Int, enrollId)
      .query(`
        SELECT CertificateStatus, CertificatePath
        FROM Enroll
        WHERE EnrollID = @EnrollID
      `);

    const row = rs.recordset[0];
    if (!row || !row.CertificatePath || row.CertificateStatus !== 'Issued') {
      return res.status(404).json({ message: 'Certificate not found or not issued' });
    }

    res.download(row.CertificatePath, `certificate_${enrollId}.pdf`);
  } catch (err) {
    console.error('Error downloading certificate:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

module.exports = router;
