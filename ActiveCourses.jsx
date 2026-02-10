// src/pages/Studentside/ActiveCourses.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ActiveCourses.css";

export default function ActiveCourses() {
  const [courses, setCourses] = useState([]);
  const [enrollingIds, setEnrollingIds] = useState([]); // array of CourseID currently enrolling
  const studentId =
    localStorage.getItem("studentId") ||
    localStorage.getItem("StudentID") ||
    null;
  const navigate = useNavigate();

  useEffect(() => {
    if (!studentId) return;

    const fetchActive = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/student/active-courses/${studentId}`
        );

        // server might return { courses: [...] } or just an array
        const payload = res.data?.courses ?? res.data ?? [];

        // normalize courses: ensure each course has isEnrolled flag (default false)
        const normalized = payload.map((c) => ({
          ...c,
          // check multiple possible server flags that might indicate enrollment
          isEnrolled:
            !!c.isEnrolled ||
            !!c.Enrolled ||
            !!c.IsEnrolled ||
            !!c.AlreadyEnrolled ||
            false,
        }));

        setCourses(normalized);
      } catch (err) {
        console.error("❌ Error fetching active courses:", err);
      }
    };

    fetchActive();
  }, [studentId]);

  const startEnrolling = (id) =>
    setEnrollingIds((prev) => Array.from(new Set([...prev, id])));
  const stopEnrolling = (id) =>
    setEnrollingIds((prev) => prev.filter((x) => x !== id));
  const isEnrolling = (id) => enrollingIds.includes(id);

  const handleEnroll = async (courseId) => {
    if (!studentId) {
      alert("Student not signed in.");
      return;
    }

    // ask timeframe
    const timeframeRaw = prompt(
      "Enter timeframe (number of weeks, e.g. 4):",
      "4"
    );
    if (timeframeRaw === null) return; // user cancelled
    const timeframe = parseInt(timeframeRaw, 10);
    if (!timeframe || timeframe <= 0) {
      alert("Please enter a valid number of weeks.");
      return;
    }

    try {
      startEnrolling(courseId);

      await axios.post("http://localhost:5000/api/student/enroll", {
        studentId: parseInt(studentId, 10),
        courseId,
        timeFrame: timeframe,
      });

      // success: mark course as enrolled, keep it visible
      setCourses((prev) =>
        prev.map((c) =>
          c.CourseID === courseId ? { ...c, isEnrolled: true } : c
        )
      );

      alert("✅ Enrolled successfully!");
    } catch (err) {
      console.error("❌ Enrollment failed:", err.response?.data ?? err.message);
      alert("Enrollment failed. See console for details.");
    } finally {
      stopEnrolling(courseId);
    }
  };

  return (
    <div className="active-courses" style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 20 }}>Active Courses</h2>

      {courses.length === 0 ? (
        <p>No active courses available.</p>
      ) : (
        <div className="course-list">
          {courses.map((course) => {
            const enrolled = !!course.isEnrolled;
            const enrolling = isEnrolling(course.CourseID);

            return (
              <div key={course.CourseID} className="course-card">
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 8px" }}>{course.CourseName}</h3>
                  {course.Description && (
                    <p style={{ margin: 0, color: "#4b5563" }}>
                      {course.Description}
                    </p>
                  )}
                </div>

                <div className="actions" style={{ marginLeft: 16 }}>
                  <button
                    onClick={() => handleEnroll(course.CourseID)}
                    disabled={enrolled || enrolling}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 6,
                      border: "none",
                      color: "#fff",
                      background: enrolled ? "#9ca3af" : "#2563eb",
                      cursor: enrolled || enrolling ? "not-allowed" : "pointer",
                    }}
                    title={
                      enrolled
                        ? "You are already enrolled in this course"
                        : "Enroll in this course"
                    }
                  >
                    {enrolling ? "Enrolling..." : enrolled ? "Enrolled" : "Enroll"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
