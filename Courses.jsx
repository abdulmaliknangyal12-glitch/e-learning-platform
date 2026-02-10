import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Courses.css";

const Courses = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [courses, setCourses] = useState([]);

  // ✅ Check if user exists in localStorage (not session)
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("You must be logged in.");
      navigate("/login");
    }
  }, [navigate]);

  // ✅ Fetch courses
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/courses")
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.courses)) {
          setCourses(res.data.courses); // ✅ set only the array
        } else {
          setCourses([]); // fallback to empty array
        }
      })
      .catch((err) => {
        console.error("Error fetching courses:", err);
        setCourses([]);
      });
  }, []);

  // ✅ Delete course by CourseID
  const handleDelete = (courseId) => {
    if (!courseId) {
      alert("Invalid CourseID");
      return;
    }
 const confirmDelete = window.confirm(
    "Are you sure you want to delete this course?"
  );
  if (!confirmDelete) return; // ❌ User cancelled

    axios
      .delete(`http://localhost:5000/api/courses/${courseId}`)
      .then(() => {
        setCourses((prev) =>
          prev.filter((course) => course.CourseID !== courseId)
        );
      })
      .catch((err) => {
        console.error("Delete failed:", err);
        alert("Delete failed: " + err.message);
      });
  };

  const handleAddCourse = () => {
    navigate("/dashboard/add-course");
  };

  const handleAssignCourse = () => {
    navigate("/dashboard/assign-course");
  };

  const handleEdit = (courseId) => {
    navigate(`/dashboard/edit-course/${courseId}`);
  };

  return (
    <div className="courses-container">
      <div className="courses-header">
        <h2>Courses</h2>
        <button className="add-button" onClick={handleAddCourse}>
          +
        </button>
      </div>

      <input
        type="text"
        className="search-bar"
        placeholder="Search here..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

    
      <div className="course-list">
        {courses
          .filter((course) =>
            (course.CourseName || "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          )
          .map((course) => (
            <div key={course.CourseID} className="course-item">
              <div className="course-details">
                <h3>{course.CourseName}</h3>
                <p>
                  <strong>Duration:</strong> {course.Cduration}
                </p>
                <p>
                  <strong>Description:</strong> {course.Description}
                </p>
                <p>
                  <strong>Status:</strong> {course.Status}
                </p>
              </div>

              <div className="dots-menu">
                <span onClick={() => handleEdit(course.CourseID)}>Edit</span>
                <span onClick={() => handleDelete(course.CourseID)}>Delete</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Courses;
