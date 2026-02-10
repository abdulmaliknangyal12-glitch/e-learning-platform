const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../../db');

// GET /api/admin/ratings
router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;

    const result = await pool.request()
      .query(`
        SELECT 
          su.FName + ' ' + su.LName AS StudentName,
          tu.FName + ' ' + tu.LName AS TeacherName,
          c.CourseName,
          r.Rating,
          r.Review
        FROM Rates r
        JOIN [User] su ON r.Sid = su.Uid          -- Student
        JOIN [User] tu ON r.Tid = tu.Uid          -- Teacher
        JOIN Course c ON r.CourseID = c.Courseid
        ORDER BY r.Rating DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching admin ratings:', err);
    res.status(500).json({ error: 'Failed to fetch admin ratings' });
  }
});

module.exports = router;
