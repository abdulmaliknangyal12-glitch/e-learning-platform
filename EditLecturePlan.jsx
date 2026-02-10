import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function EditLecturePlan() {
  const { courseId, lid } = useParams();
  const navigate = useNavigate();
  const API_BASE = "http://localhost:5000/api";

  const [form, setForm] = useState({ Content: "", Status: "Active" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // fetch lecture plan details
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await axios.get(`${API_BASE}/teacher/lecturePlans/byId/${lid}`);

        setForm({
          Content: res.data.Content,
          Status: res.data.Status,
        });
      } catch (err) {
        console.error("Failed to load plan", err);
        setError("Could not load lecture plan.");
      }
    };
    fetchPlan();
  }, [lid]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axios.put(`${API_BASE}/teacher/lecturePlans/${lid}`, form);
      setSuccess("Lecture plan updated successfully.");
      setTimeout(() => navigate(`/teacher-dashboard/${courseId}/add-lecture-plan`), 1000);
    } catch (err) {
      console.error("Update failed", err);
      setError("Failed to update lecture plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-lecture-plan">
      <h2>Edit Lecture Plan</h2>

      <form onSubmit={handleSave}>
        <label>Content</label>
        <input
          name="Content"
          value={form.Content}
          onChange={handleChange}
          required
        />

        <label>Status</label>
        <select name="Status" value={form.Status} onChange={handleChange}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
          <button type="button" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
