// src/pages/TeacherRatings.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaStar } from "react-icons/fa"; // Star icons
import { FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./TeacherRatings.css"; // Import CSS

export default function TeacherRatings() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const teacherId = localStorage.getItem("tId");
  const navigate = useNavigate();

  useEffect(() => {
    if (!teacherId) {
      setError("Teacher ID not found in session.");
      setLoading(false);
      return;
    }

    const fetchRatings = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/teacher/ratings/${teacherId}`
        );
        setRatings(res.data || []);
      } catch (err) {
        console.error("Error fetching teacher ratings:", err);
        setError("Failed to load ratings");
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [teacherId]);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar
          key={i}
          className={`star ${i <= rating ? "filled" : ""}`}
        />
      );
    }
    return stars;
  };

  if (loading) return <p className="message">Loading ratings...</p>;
  if (error) return <p className="message error">{error}</p>;

  return (
    <div className="ratings-container">
      {/* Back Button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 12,
          cursor: "pointer",
          color: "#2563eb",
          fontWeight: 600,
        }}
        onClick={() => navigate(-1)}
        role="button"
        aria-label="Go back"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") navigate(-1);
        }}
      >
        <FiArrowLeft style={{ marginRight: 8 }} />
        Back
      </div>

      <h2 className="ratings-title">My Course Ratings & Reviews</h2>

      {ratings.length === 0 ? (
        <p className="no-ratings">No ratings submitted yet.</p>
      ) : (
        <div className="ratings-list">
          {ratings.map((item, index) => (
            <div key={index} className="rating-card">
              <h3 className="course-name">{item.CourseName}</h3>

              <div className="stars">{renderStars(item.Rating)}</div>

              <p className="review">“{item.Review}”</p>

              <p className="student-name">
                — Student: {item.StudentName || `ID ${item.Sid}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
