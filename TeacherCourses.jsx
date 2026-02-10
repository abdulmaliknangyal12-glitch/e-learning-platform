// src/pages/TeacherDashboard/TeacherCourses.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import axios from "axios";
import "./TeacherCourses.css";

const TeacherCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);

    const tId = localStorage.getItem('tId');

  useEffect(() => {
    axios
  .get(`http://localhost:5000/api/teacher/assigned/${tId}`)

      .then((res) => setCourses(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="teacher-courses">
      <div className="header">
        <FiArrowLeft
          className="back-icon"
          onClick={() => navigate(-1)}
          style={{ cursor: "pointer" }}
        />
        <h2>Assigned Courses</h2>
      </div>

      <div className="course-list">
        {courses.map((course) => (
          <div
            key={course.courseId}
            className="course-item"
            onClick={() =>
              navigate(`/teacher-dashboard/${course.courseId}/details`) // ✅ Fixed path
            }
          >
            {course.CourseName}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherCourses;
