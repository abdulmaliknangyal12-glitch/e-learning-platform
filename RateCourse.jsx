import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function RateCourse() {
  const { courseId } = useParams(); // ✅ Matches App.jsx -> "course/:courseId/rate"
  const navigate = useNavigate();

  // Get studentId from localStorage (stored during login)
  const storedStudentId =
    localStorage.getItem("studentId") || localStorage.getItem("StudentID");
  const studentId = storedStudentId ? parseInt(storedStudentId, 10) : null;

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  const API_BASE =
    import.meta?.env?.VITE_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:5000";

  const handleSubmit = async () => {
    if (!studentId || !courseId || rating === 0) {
      alert("⚠️ Please provide a rating and make sure you are logged in.");
      return;
    }

    try {
      // ✅ Backend route should be /api/student/course/:courseId/rate
      await axios.post(`${API_BASE}/api/student/course/${courseId}/rate`, {
        Sid: studentId, // match your DB schema
        CourseID: Number(courseId),
        Rating: rating,
        Review: review,
      });

      alert("✅ Thanks for your feedback!");
      // ✅ Go back to StudentCourseDetail page after submit
      navigate(`/student-dashboard/courses/${courseId}`);
    } catch (err) {
      console.error("❌ Failed to submit rating:", err);
      alert("Error submitting rating. Please try again.");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "30px auto", padding: 20 }}>
      <h2>Rate This Course</h2>

      {/* Star Rating */}
      <div style={{ margin: "20px 0" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              fontSize: 30,
              cursor: "pointer",
              color: star <= rating ? "gold" : "#ccc",
            }}
            onClick={() => setRating(star)}
          >
            ★
          </span>
        ))}
      </div>

      {/* Review Box */}
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Write your review..."
        rows={4}
        style={{ width: "100%", marginBottom: 12, padding: 10 }}
      />

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        style={{
          background: "#f59e0b",
          color: "white",
          padding: "10px 20px",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Submit
      </button>
    </div>
  );
}
