// src/pages/Studentside/StudentDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./StudentDashboard.css";
import { FiBookOpen, FiAward } from "react-icons/fi";
import { AiOutlineHome } from "react-icons/ai";
import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [studentInfo, setStudentInfo] = useState({});
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [enrolledSubjectsCount, setEnrolledSubjectsCount] = useState(0);
  const [activeCoursesCount, setActiveCoursesCount] = useState(0);
  const [requestingCertificateId, setRequestingCertificateId] = useState(null);

  const studentId = Number(localStorage.getItem("studentId"));
  const API_BASE =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:5000";

  // --- Fetch student info and courses ---
  useEffect(() => {
    if (!studentId) return;

    const fetchData = async () => {
      try {
        // Student Info
        const studentRes = await axios.get(
          `${API_BASE}/api/student/info/${studentId}`
        );
        setStudentInfo(studentRes.data || {});

        // Enrolled Courses
        const enrolledRes = await axios.get(
          `${API_BASE}/api/student/enrolled/${studentId}`
        );
        const enrolledData = enrolledRes.data || [];
        setEnrolledCourses(enrolledData);
        setEnrolledSubjectsCount(enrolledData.length);

        // Active Courses
        const activeRes = await axios.get(
          `${API_BASE}/api/student/active-courses/${studentId}`
        );
        setActiveCoursesCount(activeRes.data?.count || 0);
      } catch (err) {
        console.error("❌ Failed to fetch student data", err);
      }
    };

    fetchData();
  }, [studentId]);

  // --- Request Certificate ---
  const handleRequestCertificate = async (enrollId) => {
    setRequestingCertificateId(enrollId);
    try {
      const res = await axios.put(
        `${API_BASE}/api/student/request-certificate/${enrollId}`
      );
      if (res.status === 200) {
        alert("Certificate request submitted!");
        setEnrolledCourses((prev) =>
          prev.map((course) =>
            course.EnrollID === enrollId
              ? { ...course, CertificateStatus: "Pending" }
              : course
          )
        );
      }
    } catch (err) {
      console.error("Certificate request failed", err);
      alert("Failed to request certificate");
    } finally {
      setRequestingCertificateId(null);
    }
  };

  // --- Logout function ---
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login"); // redirect to login page
  };

  return (
    <div className="student-dashboard">
      {/* Top Navbar */}
      <div className="top-navbar gray-bg">
        <div className="nav-left">
          <span
            className="nav-item clickable"
            onClick={() => navigate("/student-dashboard")}
          >
            <AiOutlineHome /> HOME
          </span>

          <span
            className="nav-item clickable"
            onClick={() => navigate("/student-dashboard/enrolled-courses")}
          >
            <FiBookOpen /> COURSES
          </span>

          <span
            className="nav-item clickable"
            onClick={() => navigate("/student-dashboard/certificates")}
          >
            <FiAward /> CERTIFICATES
          </span>
        </div>

        <div className="nav-right">
          <img
            src={studentInfo?.Picture || "/default-avatar.png"}
            alt="profile"
            className="student-avatar"
          />
          <div className="student-details">
            <h4>{studentInfo?.Name || "Student Name"}</h4>
            <p>{studentInfo?.Email || "email@example.com"}</p>
            {studentInfo?.Phone && <p>{studentInfo.Phone}</p>}
            {studentInfo?.City && <p>{studentInfo.City}</p>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-card-container">
        <div
          className="dashboard-card clickable"
          onClick={() => navigate("/student-dashboard/enrolled-courses")}
        >
          <h3>Enrolled Subjects</h3>
          <p>{enrolledSubjectsCount}</p>
        </div>

        <div
          className="dashboard-card clickable"
          onClick={() => navigate("/student-dashboard/active-courses")}
        >
          <h3>Active Courses</h3>
          <p>{activeCoursesCount}</p>
        </div>
      </div>

      {/* Enrolled Courses */}
      <h3 className="section-title">Enrolled Courses</h3>
      <div className="courses-list">
        {enrolledCourses.length === 0 ? (
          <p style={{ padding: 16 }}>No courses enrolled yet.</p>
        ) : (
          enrolledCourses.map((course) => (
            <div
              className="course-card"
              key={course.CourseID}
              onClick={() =>
                navigate(`/student-dashboard/courses/${course.CourseID}`)
              }
              style={{ cursor: "pointer", position: "relative" }}
            >
              <span className="course-name">{course.CourseName}</span>
              <span className="course-duration">
                ({course.Cduration || "N/A"})
              </span>
              <div className="dots">⋯</div>

              {/* Certificate Request Button */}
              {course.Active_Flag === 0 && (
                <div style={{ marginTop: 8 }}>
                  {course.CertificateStatus === "NotRequested" ? (
                    <button
                      disabled={requestingCertificateId === course.EnrollID}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestCertificate(course.EnrollID);
                      }}
                      style={{
                        padding: "6px 12px",
                        background: "#4caf50",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      {requestingCertificateId === course.EnrollID
                        ? "Requesting..."
                        : "Request Certificate"}
                    </button>
                  ) : course.CertificateStatus === "Pending" ? (
                    <span style={{ color: "#ff9800", fontWeight: 600 }}>
                      Certificate Pending
                    </span>
                  ) : course.CertificateStatus === "Issued" ? (
                    <span style={{ color: "#4caf50", fontWeight: 600 }}>
                      Certificate Issued
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Logout Button (Bottom Right) */}
    
    </div>
  );
};

export default StudentDashboard;
