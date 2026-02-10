const express = require("express");
const router = express.Router();
const { poolPromise } = require("../../db");
const sql = require("mssql");

/**
 * GET /api/admin/course-freeze
 * Fetch all freeze requests
 */
router.get("/", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        cf.FreezeID, 
        cf.StudentID, 
        cf.CourseID, 
        cf.StartWeek, 
        cf.EndWeek,
        cf.StartDate,
        cf.EndDate,
        cf.DurationWeeks, 
        cf.Status, 
        cf.CreatedAt,
        cf.UpdatedAt,
        c.CourseName
      FROM CourseFreeze cf
      JOIN Course c ON cf.CourseID = c.CourseID
      ORDER BY cf.CreatedAt DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching freeze requests:", err);
    res.status(500).json({ error: "Server error fetching freeze requests" });
  }
});

/**
 * PUT /api/admin/course-freeze/:freezeId/approve
 */
router.put("/:freezeId/approve", async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("FreezeID", sql.Int, req.params.freezeId)
      .query(`
        UPDATE CourseFreeze
        SET Status = 'Approved', UpdatedAt = GETDATE()
        WHERE FreezeID = @FreezeID
      `);
    res.json({ message: "Course freeze approved" });
  } catch (err) {
    console.error("Error approving freeze:", err);
    res.status(500).json({ error: "Server error approving freeze" });
  }
});

/**
 * PUT /api/admin/course-freeze/:freezeId/reject
 */
router.put("/:freezeId/reject", async (req, res) => {
  try {
    const pool = await poolPromise;
    await pool.request()
      .input("FreezeID", sql.Int, req.params.freezeId)
      .query(`
        UPDATE CourseFreeze
        SET Status = 'Rejected', UpdatedAt = GETDATE()
        WHERE FreezeID = @FreezeID
      `);
    res.json({ message: "Course freeze rejected" });
  } catch (err) {
    console.error("Error rejecting freeze:", err);
    res.status(500).json({ error: "Server error rejecting freeze" });
  }
});

module.exports = router;
