const dbconnect = require('../../db');
const sql = require('mssql');

const courseinfo = async (data) => {
  try {
    const { CourseName, Cduration, Description } = data;

    if (!CourseName || !Cduration || !Description) {
      throw new Error("CourseName, Cduration, and Description are required.");
    }

    console.log("📥 Data received:", { CourseName, Cduration, Description,Status });

    const pool = await dbconnect();

    const result = await pool.request()
      .input('CourseName', sql.VarChar(100), CourseName)
      .input('Cduration', sql.VarChar(20), Cduration)  // 👈 Must match exactly
      .input('Description', sql.VarChar(sql.MAX), Description)
      .input('Status', sql.VarChar(50), 'Active')
      .query(`
        INSERT INTO Course (CourseName, Cduration, Description, Status)
        OUTPUT INSERTED.CourseID
        VALUES (@CourseName, @Cduration, @Description, @Status)
      `);  // 👈 @Cduration must match 'Cduration'

    const courseId = result.recordset[0].CourseID;
    console.log("✅ Inserted course:", courseId);

    return { courseId };
  } catch (err) {
    console.error("❌ Error inserting course:", err.message);
    throw err;
  }
};

module.exports = courseinfo;
