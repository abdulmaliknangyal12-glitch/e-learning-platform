// src/pages/TeacherDashboard/TeacherDashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import StudentStatusList from "./StudentStatusList";
import "./TeacherDashboard.css";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [teacherInfo, setTeacherInfo] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStudentsPanel, setShowStudentsPanel] = useState(false);

  const tId = Number(localStorage.getItem("tId") || 0);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const ratingNavRef = useRef(null); // anchor for floating panel

  useEffect(() => {
    if (!tId) return;

    const fetchData = async () => {
      try {
        const [coursesRes, infoRes, pendingRes] = await Promise.all([
          axios.get(`${API_BASE}/api/teacher/assigned/${tId}`),
          axios.get(`${API_BASE}/api/teacher/${tId}/info`),
          axios.get(`${API_BASE}/api/teacher/assignments/pending/${tId}`),
        ]);

        const courseList = coursesRes.data || [];
        setCourses(courseList);
        setTeacherInfo(infoRes.data || {});
        setPendingSubmissions(pendingRes.data || []);

        // pick default selected course: previously selected, or first available
        const stored = Number(localStorage.getItem("selectedCourse") || 0);
        if (stored && courseList.some(c => Number(c.CourseID || c.courseId) === stored)) {
          setSelectedCourse(stored);
        } else if (courseList.length > 0) {
          const firstId = Number(courseList[0].CourseID ?? courseList[0].courseId);
          setSelectedCourse(firstId);
          localStorage.setItem("selectedCourse", String(firstId));
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/teacher/assignments/pending/${tId}`);
        setPendingSubmissions(res.data || []);
      } catch (err) {
        console.error("Error refreshing pending submissions:", err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [tId, API_BASE]);

  // toggle and persist selected course
  const handleSelectCourse = (courseId) => {
    setSelectedCourse(Number(courseId));
    localStorage.setItem("selectedCourse", String(courseId));
    // optionally close student panel when switching course
    // setShowStudentsPanel(false);
  };

  if (loading) return <div style={{ padding: 20 }}>Loading dashboard...</div>;

  // Pending course ID (used for quick navigation)
  const pendingCourseId =
    pendingSubmissions.length > 0
      ? pendingSubmissions[0].Courseid
      : courses.length > 0
      ? Number(courses[0].CourseID ?? courses[0].courseId)
      : null;

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="teacher-dashboard" style={{ position: "relative" }}>
      {/* Navbar */}
      <div className="teacher-navbar" style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <h3 className="logo" style={{ margin: 0 }}>📘 E-Learning (Teacher)</h3>

       

        {/* filler flex */}
        <div style={{ flex: 1 }} />

        {/* notification bell */}
        <div
          className="notification-bar"
          style={{ cursor: pendingCourseId ? "pointer" : "default", position: "relative" }}
          onClick={() => {
            if (pendingCourseId) navigate(`/teacher-dashboard/${pendingCourseId}/assignments/pending`);
          }}
        >
          🔔
          {pendingSubmissions.length > 0 && (
            <span className="notification-badge" style={{
              background: "#ef4444",
              color: "#fff",
              borderRadius: "999px",
              padding: "2px 8px",
              marginLeft: 6,
              fontSize: 12
            }}>{pendingSubmissions.length}</span>
          )}
        </div>
      </div>

      {/* Teacher Header */}
      <div className="teacher-header" style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
        <div className="teacher-profile" style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <img
            src={teacherInfo.Picture || "https://via.placeholder.com/50"}
            alt="Teacher"
            style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover" }}
          />
          <div>
            <h4 style={{ margin: 0 }}>{teacherInfo.T_Name || "Teacher Name"}</h4>
            <p style={{ margin: 0, color: "#6b7280" }}>{teacherInfo.Qualifications || "Qualifications"}</p>
          </div>
        </div>

        {/* small stats */}
        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
  
        </div>
      </div>

      {/* Top Navigation */}
      <div className="teacher-top-nav" style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center" }}>
        <div className="nav-item active" style={{ cursor: "default" }}>🏠 <span style={{ marginLeft: 6 }}>Home</span></div>

        <div
          className="nav-item"
          onClick={() => navigate("/teacher-dashboard/teacher-courses")}
          style={{ cursor: "pointer" }}
        >
          📚 <span style={{ marginLeft: 6 }}>Courses</span>
        </div>

        {/* Rating nav item */}
        <div
          className="nav-item"
          onClick={() => navigate("/teacher-dashboard/ratings")}
          style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          ⭐ <span style={{ marginLeft: 6 }}>Rating</span>
        </div>

        {/* Students toggle placed next to Rating */}
        <div style={{ display: "flex", alignItems: "center", position: "relative" }}>
          <button
            ref={ratingNavRef}
            onClick={() => setShowStudentsPanel(prev => !prev)}
            style={{
              padding: "6px 10px",
              marginLeft: 6,
              borderRadius: 6,
              border: "1px solid #e5e7eb",
              cursor: "pointer",
              background: showStudentsPanel ? "#f8fafc" : "#fff"
            }}
          >
            👥 Students
          </button>

          {/* Floating panel anchored to this button */}
          {showStudentsPanel && selectedCourse && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 8,
                width: 540,
                maxWidth: "calc(100vw - 40px)",
                zIndex: 999,
                boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                borderRadius: 8,
                background: "#fff",
                border: "1px solid #e6e6e6",
                padding: 12
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <strong style={{ fontSize: 14 }}>Students — {courses.find(c => Number(c.CourseID ?? c.courseId) === selectedCourse)?.CourseName ?? "Course"}</strong>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setShowStudentsPanel(false)}
                    style={{ border: "none", background: "transparent", cursor: "pointer", color: "#6b7280" }}
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* StudentStatusList expects courseId prop */}
              <div style={{ maxHeight: 480, overflowY: "auto" }}>
                <StudentStatusList courseId={selectedCourse} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main dashboard area - you can keep the cards or other content */}
      <div style={{ marginTop: 20 }}>
        {/* Optionally show course cards, grouped courses, etc. */}
        <div className="teacher-cards" style={{ display: "flex", gap: 12 }}>
          <div
            className="card blue"
            style={{ cursor: courses.length > 0 ? "pointer" : "default", padding: 16, borderRadius: 8 }}
            onClick={() => {
              if (courses.length > 0) navigate("/teacher-dashboard/teacher-courses");
            }}
          >
            <h2 style={{ margin: 0 }}>{courses.length}</h2>
            <p style={{ margin: 0 }}>Courses</p>
          </div>

          <div
            className="card red"
            style={{ cursor: pendingCourseId ? "pointer" : "default", padding: 16, borderRadius: 8 }}
            onClick={() => {
              if (pendingCourseId) navigate(`/teacher-dashboard/${pendingCourseId}/assignments/pending`);
            }}
          >
            <h2 style={{ margin: 0 }}>{pendingSubmissions.length}</h2>
            <p style={{ margin: 0 }}>Pending Assignments</p>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="logout-section" style={{ marginTop: 24 }}>
        <button className="logout-btn" onClick={handleLogout} style={{ padding: "8px 12px", borderRadius: 8 }}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
};

export default TeacherDashboard;
