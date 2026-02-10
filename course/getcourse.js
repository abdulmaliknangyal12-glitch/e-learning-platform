const dbconnect = require('../../db');
const sql = require('mssql');

const courseinfo = async (data) => {
  try {
    const { CourseName, Cduration, Description } = data;

    if (!CourseName || !Cduration || !Description) {
      throw new Error("CourseName, Cduration, and Description are required.");
    }

    console.log("📦 Incoming data:", { CourseName, Cduration, Description });

    const pool = await dbconnect();
    const request = pool.request();

    // Log before binding
    console.log("🧩 Binding parameters...");

    request.input('CourseName', sql.VarChar(100), CourseName);
    request.input('Cduration', sql.VarChar(20), Cduration);
    request.input('Description', sql.VarChar(sql.MAX), Description);
    request.input('Status', sql.VarChar(50), 'Active');

    // Log the intended query
    const query = `
      INSERT INTO Course (CourseName, Cduration, Description, Status)
      OUTPUT INSERTED.CourseID
      VALUES (@CourseName, @Cduration, @Description, @Status)
    `;

    console.log("🧪 Executing query:", query);

    const result = await request.query(query);

    console.log("✅ Inserted:", result.recordset[0]);

    return { courseId: result.recordset[0].CourseID };
  } catch (err) {
    console.error("❌ Error in insertSimpleCourse:", err.message);
    throw err;
  }
};

module.exports = courseinfo;
