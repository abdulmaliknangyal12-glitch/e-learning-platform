import React, { useState, useEffect } from "react";
import axios from "axios";

const StudentStatusList = ({ courseId }) => {
  const [status, setStatus] = useState("pass"); // default tab
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = "http://localhost:5000";

  const fetchStudents = async (status) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/api/teacher/course/${courseId}/students?status=${status}`
      );
      setStudents(res.data);
    } catch (err) {
      console.error("Failed to fetch students:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(status);
  }, [status, courseId]);

  return (
    <div style={{ maxWidth: 1000, margin: "20px auto", padding: 16 }}>
      <h2>Students - {status.replace("_", " ").toUpperCase()}</h2>

      {/* Status Tabs */}
      <div style={{ marginBottom: 16 }}>
        {["pass", "fail", "not_complete"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            style={{
              marginRight: 8,
              padding: "8px 16px",
              background: status === s ? "#16a34a" : "#ccc",
              color: status === s ? "#fff" : "#000",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            {s.replace("_", " ").toUpperCase()}
          </button>
        ))}
      </div>

      {/* Student Table */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f3f4f6" }}>
              <th style={cell}>Student ID</th>
              <th style={cell}>Name</th>
              <th style={cell}>Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.StudentID}>
                <td style={cell}>{student.StudentID}</td>
                <td style={cell}>{student.FName} {student.LName}</td>
                <td style={{...cell, color: getStatusColor(student.Status), fontWeight: "bold"}}>
                  {student.Status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// Cell style
const cell = {
  border: "1px solid #ddd",
  padding: "8px",
  textAlign: "center",
};

// Color badges
const getStatusColor = (status) => {
  switch (status) {
    case "Pass": return "green";
    case "Fail": return "red";
    case "Not Complete": return "orange";
    default: return "black";
  }
};

export default StudentStatusList;
