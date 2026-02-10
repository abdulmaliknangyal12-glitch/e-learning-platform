import React, { useEffect, useState } from "react";
import axios from "axios";

export default function TeacherAssignments() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradingId, setGradingId] = useState(null);
  const [grades, setGrades] = useState({}); // { [attemptId]: { ObtMarks, Remarks } }

  const teacherId = Number(localStorage.getItem("tId") || 0);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const fetchPendingSubmissions = async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/teacher/assignments/pending/${teacherId}`);
      setSubmissions(res.data || []);
    } catch (err) {
      console.error("Error fetching pending submissions:", err);
      alert("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSubmissions();
  }, []);

  const handleInputChange = (attemptId, field, value) => {
    setGrades((prev) => ({
      ...prev,
      [attemptId]: { ...prev[attemptId], [field]: value },
    }));
  };

  const handleGradeSubmit = async (attemptId) => {
    const gradeData = grades[attemptId];
    if (!gradeData || gradeData.ObtMarks == null || !gradeData.Remarks) {
      alert("Please enter marks and remarks");
      return;
    }

    setGradingId(attemptId);
    try {
      const res = await axios.put(
        `${API_BASE}/api/teacher/assignments/grade/${attemptId}`,
        {
          ObtMarks: Number(gradeData.ObtMarks),
          Remarks: gradeData.Remarks,
        }
      );

      if (res.status === 200) {
        alert("Submission graded successfully");
        setSubmissions((prev) => prev.filter((s) => s.AttemptID !== attemptId));
        setGrades((prev) => {
          const copy = { ...prev };
          delete copy[attemptId];
          return copy;
        });
      } else {
        alert("Failed to grade submission");
      }
    } catch (err) {
      console.error("Grading error:", err);
      alert(err?.response?.data?.error || "Server error grading submission");
    } finally {
      setGradingId(null);
    }
  };

  if (loading) return <div style={{ padding: 16 }}>Loading pending submissions…</div>;
  if (!submissions.length) return <div style={{ padding: 16 }}>No pending submissions</div>;

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 16 }}>
      <h2>Pending Assignment Submissions</h2>

      {submissions.map((sub) => (
        <div
          key={sub.AttemptID}
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {sub.FName} {sub.LName} (Student ID: {sub.StudentID})
          </div>
          <div style={{ fontSize: 14, marginBottom: 6 }}>
            Assignment Marks: {sub.T_Marks ?? "N/A"} | Week: {sub.WeekNumber ?? "-"}
          </div>
          <div style={{ marginBottom: 6 }}>
            <a
              href={`${API_BASE}${sub.StdFile}`}
              target="_blank"
              rel="noreferrer"
            >
              View Submitted File
            </a>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
            <input
              type="number"
              placeholder="Obtained Marks"
              min={0}
              max={sub.T_Marks ?? 100}
              value={grades[sub.AttemptID]?.ObtMarks || ""}
              onChange={(e) =>
                handleInputChange(sub.AttemptID, "ObtMarks", e.target.value)
              }
              style={{ width: 120, padding: 6, borderRadius: 4, border: "1px solid #ccc" }}
            />
            <input
              type="text"
              placeholder="Remarks"
              value={grades[sub.AttemptID]?.Remarks || ""}
              onChange={(e) =>
                handleInputChange(sub.AttemptID, "Remarks", e.target.value)
              }
              style={{ flex: 1, padding: 6, borderRadius: 4, border: "1px solid #ccc" }}
            />
            <button
              onClick={() => handleGradeSubmit(sub.AttemptID)}
              disabled={gradingId === sub.AttemptID}
              style={{
                padding: "6px 12px",
                background: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              {gradingId === sub.AttemptID ? "Grading..." : "Grade"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
