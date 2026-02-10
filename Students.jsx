// src/pages/Admin/Students.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Students.css";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/students/all");

        // Normalize data from backend
        const data = Array.isArray(res.data) ? res.data : [];
        const normalized = data.map((s) => ({
          StudentId: s.StudentId || s.studentid || s.id || 0,
          Name: s.Name || s.name || "Unnamed",
          Email: s.Email || s.email || "No Email",
          Picture: s.Picture || s.picture || null, // ✅ include picture
        }));

        setStudents(normalized);
      } catch (err) {
        console.error("Failed to load students:", err);
        setStudents([]);
      }
    };

    fetchStudents();
  }, []);

  const handleAddStudent = () => {
    navigate("/dashboard/add-students");
  };

  const filteredStudents = students.filter((student) =>
    student?.Name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="students-container">
      <div className="students-header">
        <h2>Students</h2>
        <button className="add-btn" onClick={handleAddStudent}>+</button>
      </div>

      <input
        className="search-input"
        type="text"
        placeholder="Search students..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="students-list">
        {filteredStudents.length > 0 ? (
          filteredStudents.map((student) => (
            <div
              className="student-card"
              key={student.StudentId}
              onClick={() =>
                navigate(`/dashboard/students/${student.StudentId}`)
              }
              style={{ cursor: "pointer" }}
            >
              <img
                // ✅ Use uploaded picture if available, else fallback to lego avatar
                src={
                  student.Picture
                    ? `http://localhost:5000${student.Picture}`
                    : `https://randomuser.me/api/portraits/lego/${student.StudentId % 10}.jpg`
                }
                alt={student.Name}
              />
              <div className="student-info">
                <h3>{student.Name}</h3>
                <p>{student.Email}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="no-students">No students found.</p>
        )}
      </div>
    </div>
  );
};

export default Students;
