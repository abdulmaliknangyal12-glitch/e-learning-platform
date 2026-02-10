import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./EnrolledCourses.css";

export default function EnrolledCourses() {
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();
  const studentId = localStorage.getItem("studentId") || localStorage.getItem("StudentID");

  useEffect(() => {
    if (studentId) {
      axios
        .get(`http://localhost:5000/api/student/enrolled/${studentId}`)
        .then((res) => setCourses(res.data || []))
        .catch((err) => console.error("Error fetching enrolled courses:", err));
    }
  }, [studentId]);

  return (
    <div className="enrolled-courses">
      <h2>My Enrolled Courses</h2>
      {courses.length === 0 ? (
        <p>You have not enrolled in any courses yet.</p>
      ) : (
        <div className="course-list">
          {courses.map((course) => (
            <div
              key={course.CourseID}
              className="course-card"
              onClick={() => navigate(`/student-dashboard/courses/${course.CourseID}`)}
            >
              <h3>{course.CourseName}</h3>
              <p>{course.Description}</p>
              <span>Duration: {course.Cduration}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
