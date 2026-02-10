// src/pages/Student/StudentAssignment.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

export default function StudentAssignment({ studentId, courseId, apiBase }) {
  const API_BASE = apiBase?.replace(/\/$/, "") || "";
  const [assignments, setAssignments] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/student/courses/${courseId}/assignments`);
        const data = Array.isArray(res.data) ? res.data : res.data.assignments ?? [];
        setAssignments(data);
      } catch (err) {
        console.error("Error fetching assignments:", err);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [API_BASE, courseId]);

  const handleFileChange = (asid, file) => {
    setSelectedFiles((prev) => ({ ...prev, [asid]: file }));
  };

  const handleSubmit = async (asid) => {
    const file = selectedFiles[asid];
    if (!file) {
      alert("Please choose a file before submitting.");
      return;
    }
    if (!studentId) {
      alert("Missing student ID.");
      return;
    }

    const fd = new FormData();
    fd.append("studentId", studentId);
    if (courseId) fd.append("courseId", courseId);
    fd.append("file", file);

    try {
      const res = await axios.post(
        `${API_BASE}/api/student/assignments/${asid}/submit`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert(res.data?.message ?? "Assignment submitted successfully ✅");

      // clear file selection for this assignment
      setSelectedFiles((prev) => {
        const next = { ...prev };
        delete next[asid];
        return next;
      });

      // Optionally re-fetch assignments or update UI here
    } catch (err) {
      console.error("Error submitting assignment:", err);
      const msg = err?.response?.data?.error || err?.response?.data?.message;
      alert(msg || "Error submitting assignment ❌");
    }
  };

  if (loading) return <div className="p-4">Loading assignments…</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Assignments</h2>
      {assignments.length === 0 ? (
        <p>No assignments available yet.</p>
      ) : (
        <ul className="space-y-4">
          {assignments.map((a) => {
            const asid = a.Asid ?? a.AssignmentID ?? a.asid ?? a.aid; // accept different shapes
            const title = a.Title ?? a.FileName ?? `Assignment ${asid}`;
            const fileLink = a.File ?? a.FilePath ?? a.file ?? null;

            return (
              <li key={asid} className="border p-4 rounded-lg shadow-sm flex flex-col gap-2">
                <div className="font-semibold">{title}</div>

                {fileLink ? (
                  <a href={fileLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    View Assignment
                  </a>
                ) : (
                  <div className="text-sm text-gray-600">No file attached by teacher</div>
                )}

                <label className="mt-2">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange(asid, e.target.files[0])}
                  />
                </label>

                <div>
                  <button
                    onClick={() => handleSubmit(asid)}
                    className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
                  >
                    Submit
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
