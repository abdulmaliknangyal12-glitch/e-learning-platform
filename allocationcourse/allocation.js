const dbconnect = require('../dbconnect');

const allocateTeacherToCourse = async (data) => {
    let transaction;

    try {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid allocation data.');
        }

        const requiredFields = ['Tid', 'SID', 'Courseid'];
        for (const field of requiredFields) {
            if (!data[field]) throw new Error(`Missing required field: ${field}`);
        }

        const pool = await dbconnect();
        transaction = pool.transaction();
        await transaction.begin();

        // ✅ Check if the teacher is already allocated for this course & semester
        const checkAllocation = await transaction.request()
            .input('Tid', data.Tid)
            .input('SID', data.SID)
            .input('Courseid', data.Courseid)
            .query(`
                SELECT * FROM Allocation WHERE Tid = @Tid AND SID = @SID AND Courseid = @Courseid;
            `);

        if (checkAllocation.recordset.length > 0) {
            throw new Error('Teacher is already allocated to this course in the selected semester.');
        }

        // ✅ Insert into Allocation table
        await transaction.request()
            .input('Tid', data.Tid)
            .input('SID', data.SID)
            .input('Courseid', data.Courseid)
            .query(`
                INSERT INTO Allocation (Tid, SID, Courseid)
                VALUES (@Tid, @SID, @Courseid);
            `);

        await transaction.commit();
        console.log(`Teacher allocated successfully to Course ID: ${data.Courseid}`);
        return { message: "Course allocated successfully!" };

    } catch (err) {
        if (transaction) await transaction.rollback();
        console.error("Error allocating course:", err.message);
        throw err;
    }
};

module.exports = { allocateTeacherToCourse };
