// src/pages/Teacher/StudentProgress.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiArrowLeft } from "react-icons/fi";
import "./StudentProgress.css";

export default function StudentProgress() {
  const { courseId, studentId } = useParams();
  const navigate = useNavigate();

  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!studentId || !courseId) {
      setError("Missing Student ID or Course ID in URL");
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await axios.get(
          `http://localhost:5000/api/teacher/student-progress/${studentId}/${courseId}`
        );

        if (res.data) {
          setProgress({
            studentId: res.data.StudentID,
            courseId: res.data.CourseID,
            allocationId: res.data.AllocationID,
            teacherId: res.data.TeacherID,
            totalLectures: res.data.TotalLectures,
            completedLectures: res.data.CompletedLectures,
            totalQuizzes: res.data.TotalQuizzes,
            completedQuizzes: res.data.CompletedQuizzes,
            totalAssignments: res.data.TotalAssignments,
            completedAssignments: res.data.CompletedAssignments,
          });
        } else {
          setError("No progress data found.");
        }
      } catch (err) {
        console.error("Error fetching progress:", err);
        setError("Failed to fetch progress data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [studentId, courseId]);

  if (loading) return <p className="text-center text-blue-500">Loading progress...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (!progress) return <p className="text-center text-gray-500">No progress available.</p>;

  const calcPercent = (completed, total) =>
    total > 0 ? Math.round((completed / total) * 100) : 0;

  const overallPercent = calcPercent(
    progress.completedLectures + progress.completedQuizzes + progress.completedAssignments,
    progress.totalLectures + progress.totalQuizzes + progress.totalAssignments
  );

  return (
    <div className="student-progress p-6 max-w-5xl mx-auto">
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

      <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
        📊 Student Progress Report
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Lectures Card */}
        <div className="card">
          <h3>Lectures</h3>
          <p>Total: {progress.totalLectures}</p>
          <p>Completed: {progress.completedLectures}</p>
          <p>Progress: {calcPercent(progress.completedLectures, progress.totalLectures)}%</p>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{
                width: `${calcPercent(progress.completedLectures, progress.totalLectures)}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Quizzes Card */}
        <div className="card">
          <h3>Quizzes</h3>
          <p>Total: {progress.totalQuizzes}</p>
          <p>Completed: {progress.completedQuizzes}</p>
          <p>Progress: {calcPercent(progress.completedQuizzes, progress.totalQuizzes)}%</p>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{
                width: `${calcPercent(progress.completedQuizzes, progress.totalQuizzes)}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Assignments Card */}
        <div className="card">
          <h3>Assignments</h3>
          <p>Total: {progress.totalAssignments}</p>
          <p>Completed: {progress.completedAssignments}</p>
          <p>Progress: {calcPercent(progress.completedAssignments, progress.totalAssignments)}%</p>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{
                width: `${calcPercent(progress.completedAssignments, progress.totalAssignments)}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Overall Progress Card */}
        <div className="card overall">
          <h3>Overall Progress</h3>
          <p className="overall-percent">{overallPercent}%</p>
          <p className="ids">
            Student ID: {progress.studentId} <br />
            Course ID: {progress.courseId} <br />
            Teacher ID: {progress.teacherId}
          </p>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${overallPercent}%`, backgroundColor: "#2563eb" }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
