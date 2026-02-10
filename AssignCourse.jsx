import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import "./AssignCourse.css";

const AssignCourse = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Teacher's ID

  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  // ✅ Set valid Semester ID
  const [selectedSID] = useState(2009);

  // ✅ Normalize API response (handles both uppercase & lowercase keys)
  const normalizeCourse = (c) => {
    return {
      CourseID: c.CourseID ?? c.Courseid ?? c.courseid,
      CourseName:
        c.CourseName ?? c.Coursename ?? c.courseName ?? c.coursename,
    };
  };

  // ✅ Fetch all courses
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/courses/")
      .then((res) => {
        if (res.data.success && Array.isArray(res.data.courses)) {
          const normalized = res.data.courses.map(normalizeCourse);
          setCourses(normalized);
          setFilteredCourses(normalized);
        } else {
          console.error("Unexpected API response:", res.data);
          setCourses([]);
          setFilteredCourses([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching courses:", err);
      });
  }, []);

  // ✅ Filter courses by search term
  useEffect(() => {
    setFilteredCourses(
      courses.filter((c) =>
        (c.CourseName || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, courses]);

  // ✅ Select a course from dropdown
  const handleSelectCourse = (course) => {
    console.log("course clicked:", course);
    setSelectedCourseId(course.CourseID);
    setSearchTerm(course.CourseName);
    setFilteredCourses([]);
  };

  // ✅ Assign course to teacher
  const handleAssign = () => {
    console.log(">> About to assign, selectedCourseId =", selectedCourseId);
    if (!selectedCourseId) {
      return alert("Please select a course");
    }

    axios
      .post("http://localhost:5000/api/teacher/assigned", {
        Tid: parseInt(id, 10),
        courseId: parseInt(selectedCourseId, 10), // 👈 lowercase to match backend
        SID: selectedSID,
      })
      .then((res) => {
        alert(res.data.message || "Course assigned successfully");
        navigate(-1);
      })
      .catch((err) => {
        console.error("Assignment error:", err);
        alert(err.response?.data?.error || "Assignment failed");
      });
  };

  return (
    <div className="assign-course">
      <div className="header">
        <FiArrowLeft onClick={() => navigate(-1)} className="back-icon" />
        <h2>Assign Course</h2>
      </div>

      <div className="course-search-container">
        <label htmlFor="course-search">Search Course</label>
        <input
          id="course-search"
          type="text"
          placeholder="Type course name..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setSelectedCourseId(null);
          }}
          className="search-input"
        />

        {filteredCourses.length > 0 && (
          <ul className="dropdown-list">
            {filteredCourses.map((course) => (
              <li
                key={course.CourseID}
                onClick={() => handleSelectCourse(course)}
              >
                {course.CourseName}
              </li>
            ))}
          </ul>
        )}
      </div>

      <br />
      <br />
      <br />
      <br />

      <button className="assign-btn" onClick={handleAssign}>
        Assign
      </button>
    </div>
  );
};

export default AssignCourse;
