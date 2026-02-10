import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiMoreVertical,
  FiBriefcase,
  FiDollarSign,
  FiUser,
  FiMail,
  FiPhone,
} from "react-icons/fi";
import "./TeacherDetail.css";

const TeacherDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showCourseMenu, setShowCourseMenu] = useState(null);

  const headerMenuRef = useRef();
  const courseMenuRef = useRef();

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target)) {
        setShowHeaderMenu(false);
      }
      if (courseMenuRef.current && !courseMenuRef.current.contains(event.target)) {
        setShowCourseMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch teacher info
  useEffect(() => {
    fetch(`http://localhost:5000/api/teachers/${id}`)
      .then((res) => res.json())
      .then((data) => setTeacher(data))
      .catch((err) => console.error("Failed to fetch teacher:", err));
  }, [id]);

  // Fetch assigned courses
  useEffect(() => {
    fetch(`http://localhost:5000/api/teachers/assigned/${id}`)
      .then((res) => res.json())
      .then((data) => setAssignedCourses(data))
      .catch((err) => console.error("Failed to fetch assigned courses:", err));
  }, [id]);

  const handleEditTeacher = () => navigate(`/dashboard/teachers/edit/${id}`);

  const handleDeleteTeacher = async () => {
    if (!window.confirm("Are you sure you want to delete this teacher?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/teachers/${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("Teacher deleted successfully");
        navigate("/dashboard/teachers");
      } else {
        alert("Failed to delete teacher");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting teacher");
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to remove this course?")) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/teachers/assigned/${id}/${courseId}`,
        { method: "DELETE" }
      );
      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        setAssignedCourses((prev) => prev.filter((c) => c.courseId !== courseId));
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting assigned course");
    }
  };

  if (!teacher) return <p>Loading...</p>;

  return (
    <div className="teacher-detail-container">
      {/* Header */}
      <div className="detail-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <FiArrowLeft />
        </button>
        <h2 className="detail-title">Teacher Details</h2>

        <div className="menu-wrapper" ref={headerMenuRef}>
          <FiMoreVertical
            className="menu-icon"
            onClick={() => setShowHeaderMenu(!showHeaderMenu)}
          />
          {showHeaderMenu && (
            <div className="dropdown">
              <div onClick={handleEditTeacher}> Edit </div>
              <br />
              <div onClick={handleDeleteTeacher}> Delete </div>
            </div>
          )}
        </div>
      </div>

      {/* Profile */}
      <div className="profile-card">
        <img src={teacher.Picture} alt="Teacher" className="teacher-img" />
        <h3><FiUser /> {teacher.FName} {teacher.LName}</h3>
        <p><FiMail /> {teacher.Email}</p>
        <p><FiPhone /> {teacher.PhoneNo}</p>
        <p><FiDollarSign />  {teacher.Salary}</p>

        <div className="qualifications-list">
          <p><FiBriefcase /> Qualifications:</p>
          {teacher.Qualifications?.length ? (
            <ul>{teacher.Qualifications.map((q, idx) => <li key={idx}>{q}</li>)}</ul>
          ) : <p>N/A</p>}
        </div>
      </div>

      {/* Assigned Courses */}
      <div className="course-box">
        <h4>Assigned Courses</h4>
        <div className="course-tags">
          {assignedCourses.length ? (
            assignedCourses.map((course) => (
              <div key={course.courseId} className="course-tag-wrapper">
                <span className="tag">{course.CourseName}</span>
                <div className="menu-wrapper" ref={courseMenuRef}>
                  <FiMoreVertical
                    className="menu-icon"
                    onClick={() =>
                      setShowCourseMenu(showCourseMenu === course.courseId ? null : course.courseId)
                    }
                  />
                  {showCourseMenu === course.courseId && (
                    <div className="dropdown">
                      <div onClick={() => alert("Edit course clicked")}> Edit </div>
                      br
                      <div onClick={() => handleDeleteCourse(course.courseId)}>Delete </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <span className="tag">No courses assigned</span>
          )}
        </div>
      </div>

      {/* Floating Add Course Button */}
      <button
        className="fab"
        onClick={() => navigate(`/dashboard/assign-course/${id}`)}
      >
        Assign Course
      </button>
    </div>
  );
};

export default TeacherDetail;
