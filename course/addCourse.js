// backend/routes/course/addCourse.js
const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../../db'); // adjust path if your db export differs

// POST /api/courses
router.post('/', async (req, res) => {
  try {
    console.log('---- /api/courses POST ----');
    console.log('headers content-type:', req.headers['content-type']);
    console.log('raw body:', JSON.stringify(req.body));
    console.log('Cduration typeof:', typeof req.body?.Cduration, 'value:', JSON.stringify(req.body?.Cduration));
    console.log('----------------------------');

    const { CourseName, Cduration, Description, Status } = req.body || {};

    if (!CourseName || (Cduration == null) || !Description || !Status) {
      return res.status(400).json({
        success: false,
        message: 'All fields required: CourseName, Cduration, Description, Status'
      });
    }

    const pool = await poolPromise;

    // NOTE: use exact column name Cduration and output it with same alias casing
    const result = await pool.request()
      .input('CourseName', sql.VarChar(100), String(CourseName).trim())
      .input('Cduration', sql.VarChar(20), String(Cduration).trim())
      .input('Description', sql.VarChar(sql.MAX), String(Description).trim())
      .input('Status', sql.NVarChar(40), String(Status).trim())
      .query(`
        INSERT INTO Course (CourseName, Cduration, Description, Status)
        OUTPUT
          INSERTED.Courseid  AS CourseID,
          INSERTED.CourseName AS CourseName,
          INSERTED.Cduration  AS Cduration,
          INSERTED.Description AS Description,
          INSERTED.Status     AS Status
        VALUES (@CourseName, @Cduration, @Description, @Status)
      `);

    const inserted = (result.recordset && result.recordset[0]) ? result.recordset[0] : null;
    console.log('DB inserted row:', inserted);

    return res.status(201).json({
      success: true,
      message: 'Course created',
      course: inserted
    });
  } catch (err) {
    console.error('❌ /api/courses POST error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
