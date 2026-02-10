const dbconnect = require('../dbconnect');

const enrollSubject = async (timeframe, CourseID, UserID) => {
    let transaction;

    try {
        // Validate inputs
        if (!UserID || !CourseID || !timeframe) {
            throw new Error("Missing required fields (UserID, CourseID, Timeframe).");
        }

        const pool = await dbconnect();
        transaction = pool.transaction();
        await transaction.begin();

        // 1. Validate UserID is a student
        const userResult = await transaction.request()
            .input('UserID', UserID)
            .query(`
                SELECT u.Uid 
                FROM [User] u 
                WHERE u.Uid = @UserID AND u.Role = 'Student';
            `);

        if (!userResult.recordset || userResult.recordset.length === 0) {
            throw new Error("User is not registered as a student.");
        }

        const Sid = userResult.recordset[0].Uid;

        // 2. Validate CourseID
        const courseResult = await transaction.request()
            .input('CourseID', CourseID)
            .query(`
                SELECT Courseid 
                FROM Course 
                WHERE Courseid = @CourseID AND Status = 'Active';
            `);

        if (!courseResult.recordset || courseResult.recordset.length === 0) {
            throw new Error("Invalid or inactive course.");
        }

        // 3. Get Current Semester
        const semesterResult = await transaction.request()
            .query(`
                SELECT TOP 1 SID 
                FROM Semester 
                WHERE S_Status = 'Active'
                ORDER BY S_StartDate DESC;
            `);

        if (!semesterResult.recordset || semesterResult.recordset.length === 0) {
            throw new Error("No active semester found.");
        }

        const CurrentSemesterID = semesterResult.recordset[0].SID;

        // 4. Check if student is already enrolled in the course for this semester
        const checkEnrollment = await transaction.request()
            .input('Sid', Sid)
            .input('CourseID', CourseID)
            .input('SemesterID', CurrentSemesterID)
            .query(`
                SELECT 1 
                FROM Enroll e
                JOIN Allocation a ON e.AllocationID = a.AllocationID
                WHERE e.Sid = @Sid 
                AND e.CourseID = @CourseID 
                AND a.SID = @SemesterID;
            `);

        if (checkEnrollment.recordset.length > 0) {
            throw new Error("Student is already enrolled in this course for the current semester.");
        }

        // 5. Ensure an Allocation record exists
        let allocationResult = await transaction.request()
            .input('CourseID', CourseID)
            .input('SemesterID', CurrentSemesterID)
            .query(`
                SELECT TOP 1 AllocationID 
                FROM Allocation 
                WHERE Courseid = @CourseID AND SID = @SemesterID;
            `);

        let AllocationID;

        if (!allocationResult.recordset || allocationResult.recordset.length === 0) {
            // Create a new Allocation record if none exists
            const teacherResult = await transaction.request()
                .query(`
                    SELECT TOP 1 Tid 
                    FROM Teacher;
                `);

            if (!teacherResult.recordset || teacherResult.recordset.length === 0) {
                throw new Error("No teachers available to assign.");
            }

            const Tid = teacherResult.recordset[0].Tid;

            allocationResult = await transaction.request()
                .input('Tid', Tid)
                .input('SID', CurrentSemesterID)
                .input('CourseID', CourseID)
                .query(`
                    INSERT INTO Allocation (Tid, SID, Courseid)
                    OUTPUT INSERTED.AllocationID
                    VALUES (@Tid, @SID, @CourseID);
                `);

            AllocationID = allocationResult.recordset[0].AllocationID;
        } else {
            AllocationID = allocationResult.recordset[0].AllocationID;
        }

        // 6. Insert into Enroll Table
        await transaction.request()
            .input('Sid', Sid)
            .input('CourseID', CourseID)
            .input('Timeframe', timeframe)
            .input('AllocationID', AllocationID)
            .query(`
                INSERT INTO Enroll (Sid, CourseID, Timeframe, S_Date, End_Date, Active_Flag, Certificate, AllocationID)
                VALUES (@Sid, @CourseID, @Timeframe, GETDATE(), DATEADD(WEEK, @Timeframe, GETDATE()), 1, 0, @AllocationID);
            `);

        await transaction.commit();
        console.log("✅ Student enrolled in subject successfully!");
        return { message: "Student enrolled in subject successfully!" };

    } catch (err) {
        if (transaction) {
            console.log("🔄 Rolling back transaction due to error.");
            await transaction.rollback();
        }
        console.error("❌ Error enrolling student:", err.message);
        throw err;
    }
};

module.exports = enrollSubject;