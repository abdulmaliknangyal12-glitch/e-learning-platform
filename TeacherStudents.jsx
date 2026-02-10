import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function TeacherStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const tId = localStorage.getItem("tId");

  useEffect(() => {
    if (!tId) return;

    axios
      .get(`http://localhost:5000/api/teacher/${tId}/students`)
      .then((res) => setStudents(res.data))
      .catch((err) => console.error(err));
  }, [tId]);

  return (
    <div>
      <h2>Enrolled Students</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Course</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.SID}>
              <td>{s.Name}</td>
              <td>{s.Email}</td>
              <td>{s.CourseName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
