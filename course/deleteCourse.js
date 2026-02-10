const express = require('express');
const router = express.Router();
const { poolPromise } = require('../../db');
const sql = require('mssql'); // 👈 You forgot this import

router.delete('/:id', async (req, res) => {
  try {
    const courseId = parseInt(req.params.id, 10);
    if (isNaN(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid CourseID' });
    }

    const pool = await poolPromise;

    await pool.request()
      .input('CourseID', sql.Int, courseId)
      .query('DELETE FROM Course WHERE CourseID = @CourseID');

    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (err) {
    console.error('❌ deleteCourse Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;
