import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./EditCourse.css";

const EditCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [courseName, setCourseName] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/courses/${id}`);
        const data = await res.json();

        if (res.ok) {
          setCourseName(data.CourseName);
          setDuration(data.Cduration);
          setDescription(data.Description);
          setStatus(data.Status);
        } else {
          setError(data.message || "Failed to fetch course data.");
        }
      } catch (err) {
        setError("Server error. Try again later.");
        console.error("Fetch error:", err);
      }
    };

    fetchCourse();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");

    if (!courseName.trim() || !duration || !description.trim()) {
      setError("Please fill out all fields.");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/courses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          CourseName: courseName.trim(),
          Cduration: duration,
          Description: description.trim(),
          Status: status,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        navigate("/dashboard/courses");
      } else {
        setError(result.message || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err);
      setError("Server error. Try again later.");
    }
  };

  return (
    <div className="edit-course-container">
      <form className="edit-course-form" onSubmit={handleUpdate} noValidate>
        <div className="edit-header">
          <button type="button" className="back-button" onClick={() => navigate(-1)}>←</button>
          <h2>Edit Course</h2>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label>Course Name</label>
          <input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Duration</label>
          <select value={duration} onChange={(e) => setDuration(e.target.value)} required>
            <option value="">Select Duration</option>
            <option value="4 Weeks">4 Weeks</option>
            <option value="8 Weeks">8 Weeks</option>
            <option value="12 Weeks">12 Weeks</option>
            <option value="16 Weeks">16 Weeks</option>
          </select>
        </div>

        <div className="form-group">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} required>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="form-group full-width">
          <label>Course Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <button type="submit">Update Course</button>
      </form>
    </div>
  );
};

export default EditCourse;