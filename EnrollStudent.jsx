import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./EnrollStudent.css"; // ✅ Import the CSS

const EnrollStudent = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/teacher/students")
      .then((res) => setStudents(res.data))
      .catch((err) => console.error("Failed to fetch students", err));
  }, []);

  const handleEnroll = async (e) => {
    e.preventDefault();
    const tId = localStorage.getItem("tId");
    try {
      await axios.post("http://localhost:5000/api/teacher/enroll-student", {
        SID: selectedStudent,
        courseId,
        tId,
      });
      alert("✅ Student enrolled successfully");
      navigate(`/teacher-dashboard/${courseId}/details`);
    } catch (err) {
      console.error("Enrollment error:", err);
      alert("❌ Enrollment failed");
    }
  };

  return (
    <div className="enroll-student-container">
      <h2>Enroll a Student</h2>
      <form onSubmit={handleEnroll} className="enroll-form">
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          required
        >
          <option value="">-- Select Student --</option>
          {students.map((s) => (
            <option key={s.SID} value={s.SID}>
              {s.Name} ({s.Email})
            </option>
          ))}
      
        </select>
        <br />
        <br />
        <button type="submit">Enroll Student</button>
      </form>
    </div>
  );
};

export default EnrollStudent;
