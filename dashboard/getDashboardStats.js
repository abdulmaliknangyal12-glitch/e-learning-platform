const express = require('express');
const router = express.Router();
const { poolPromise } = require('../../db');

router.get('/', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM Student) AS studentCount,
        (SELECT COUNT(*) FROM Course) AS courseCount,
        (SELECT COUNT(*) FROM Teacher) AS teacherCount
    `); // ✅ Removed Semester count

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
