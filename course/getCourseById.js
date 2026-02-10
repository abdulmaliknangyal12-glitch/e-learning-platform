const express = require('express');
const router = express.Router();
const { poolPromise } = require('../../db');
const sql = require('mssql'); // ✅ FIXED: missing import

router.get('/:id', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    if (isNaN(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid CourseID' });
    }

    const pool = await poolPromise;
    const result = await pool.request()
      .input('CourseID', sql.Int, courseId)
      .query('SELECT CourseID, CourseName, Cduration, Description, Status FROM Course WHERE CourseID = @CourseID');

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // 🔑 Send the course object directly (not wrapped inside "course")
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('❌ getCourseById Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
