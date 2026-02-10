const express = require('express');
const router = express.Router();
const { poolPromise } = require('../../db');

router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT CourseID, CourseName, Cduration, Description, Status 
      FROM Course
    `);
    res.json({ success: true, courses: result.recordset });
  } catch (err) {
    console.error('❌ getAllCourses Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
