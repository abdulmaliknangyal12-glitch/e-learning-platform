// src/pages/TeacherDashboard/AddLecturePlan.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiArrowLeft } from "react-icons/fi";
import "./AddLecture.css"; // keep your stylesheet

export default function AddLecturePlan() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ Content: "", Status: "Active" });
  const [allocationId, setAllocationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState([]);

  const [successMessage, setSuccessMessage] = useState("");
  const [createdLID, setCreatedLID] = useState(null);

  // UI states for menus / edit modal
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null); // { LID, Content, Status }

  const Tid = parseInt(localStorage.getItem("tId"), 10) || null;
  const API_BASE = "http://localhost:5000/api";

  // fetch allocation
  const fetchAllocation = useCallback(async () => {
    if (!Tid || !courseId) return;
    try {
      const res = await axios.get(
        `${API_BASE}/teacher/courses/${courseId}/allocation?Tid=${Tid}`
      );
      setAllocationId(res.data?.AllocationID ?? null);
      setError("");
    } catch (err) {
      console.error("Failed to fetch allocation", err);
      setAllocationId(null);
      setError("Could not fetch AllocationID.");
    }
  }, [Tid, courseId]);

  // fetch plans for the course
  const fetchPlans = useCallback(async () => {
    if (!courseId) return;
    try {
      const res = await axios.get(
        `${API_BASE}/teacher/courses/${courseId}/lecturePlans?Tid=${Tid}`
      );
      setPlans(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch plans", err);
      setPlans([]);
    }
  }, [courseId, Tid]);

  useEffect(() => {
    if (Tid) {
      fetchAllocation();
      fetchPlans();
    }
  }, [Tid, fetchAllocation, fetchPlans]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const resetForm = () => {
    setForm({ Content: "", Status: "Active" });
    setError("");
    setSuccessMessage("");
    setCreatedLID(null);
  };

  // Add a new lecture plan (POST)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setCreatedLID(null);

    if (!form.Content || !form.Content.trim()) {
      setError("Please enter lecture plan content.");
      return;
    }
    if (!allocationId) {
      setError("Allocation not found for this course.");
      return;
    }

    const payload = {
      Content: form.Content.trim(),
      Status: form.Status,
      AllocationID: allocationId,
    };

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/teacher/lecturePlans`, payload);

      // accept different shapes of response
      const newLID =
        res?.data?.LID ??
        res?.data?.lecturePlan?.LID ??
        (res?.data?.lecturePlan && res.data.lecturePlan.LID) ??
        null;

      setSuccessMessage("Lecture plan added successfully.");
      if (newLID) {
        setCreatedLID(newLID);
        setPlans((prev) => [
          { LID: newLID, Content: payload.Content, Status: payload.Status, AllocationID: allocationId },
          ...prev,
        ]);
      } else if (res?.data) {
        // try to append returned object if present
        const returned = res.data;
        if (returned.LID) {
          setCreatedLID(returned.LID);
          setPlans((prev) => [returned, ...prev]);
        }
      }
    } catch (err) {
      console.error("Failed to save plan", err);
      setError(err?.response?.data?.message || "Failed to save lecture plan.");
    } finally {
      setLoading(false);
    }
  };

  // Delete a plan
  const handleDelete = async (plan) => {
    const ok = window.confirm(`Delete lecture plan "${plan.Content}"? This is permanent.`);
    if (!ok) return;

    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/teacher/lecturePlans/${plan.LID}`);
      // optimistic UI update
      setPlans((prev) => prev.filter((p) => p.LID !== plan.LID));
      setSuccessMessage("Lecture plan deleted.");
      setOpenMenuId(null);
    } catch (err) {
      console.error("Failed to delete plan", err);
      setError(err?.response?.data?.message || "Failed to delete lecture plan.");
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal (in-place)
  const openEdit = (plan) => {
    setEditingPlan({ LID: plan.LID, Content: plan.Content, Status: plan.Status });
    setOpenMenuId(null);
  };

  // Save edited plan (PUT)
  const saveEdit = async () => {
    if (!editingPlan.Content || !editingPlan.Content.trim()) {
      setError("Content cannot be empty.");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        Content: editingPlan.Content.trim(),
        Status: editingPlan.Status,
        AllocationID: allocationId, // safe to include
      };
      await axios.put(`${API_BASE}/teacher/lecturePlans/${editingPlan.LID}`, payload);

      // update UI
      setPlans((prev) =>
        prev.map((p) => (p.LID === editingPlan.LID ? { ...p, Content: payload.Content, Status: payload.Status } : p))
      );
      setSuccessMessage("Lecture plan updated.");
      setEditingPlan(null);
    } catch (err) {
      console.error("Failed to update plan", err);
      setError(err?.response?.data?.message || "Failed to update lecture plan.");
    } finally {
      setLoading(false);
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingPlan(null);
    setError("");
  };

  // Small presentational components/styles
  const styles = {
    planList: { marginTop: 20, display: "grid", gap: 12 },
    planItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 14px",
      borderRadius: 8,
      background: "#fff",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      border: "1px solid #e6e6e6",
    },
    left: { display: "flex", alignItems: "center", gap: 12 },
    title: { fontSize: 15, fontWeight: 600 },
    meta: { fontSize: 13, color: "#555" },
    badge: {
      padding: "4px 8px",
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      marginLeft: 8,
    },
    menuBtn: {
      border: "none",
      background: "transparent",
      fontSize: 20,
      cursor: "pointer",
      padding: "4px 6px",
    },
    menu: {
      position: "absolute",
      right: 12,
      top: 36,
      background: "#fff",
      border: "1px solid #ddd",
      borderRadius: 6,
      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
      zIndex: 50,
      overflow: "hidden",
    },
    menuItem: {
      padding: "8px 12px",
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
    modalOverlay: {
      position: "fixed",
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
    },
    modal: {
      width: 520,
      background: "#fff",
      padding: 20,
      borderRadius: 10,
      boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
    },
  };

  return (
    <div className="add-lecture-plan-container">
      {/* Back Button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 16,
          cursor: "pointer",
          color: "#2563eb",
          fontWeight: 600,
        }}
        onClick={() => navigate(-1)}
        role="button"
        aria-label="Go back"
      >
        <FiArrowLeft style={{ marginRight: 8 }} />
        Back
      </div>

      <h2>Add Lecture Plan</h2>

      <form className="lecture-form" onSubmit={handleSubmit}>
        <label>Content</label>
        <input
          name="Content"
          value={form.Content}
          onChange={handleChange}
          required
          placeholder="e.g. Number Systems"
        />

        <label>Allocation</label>
        <input type="text" value={allocationId ?? ""} disabled placeholder="Auto-fetched" />

        <label>Status</label>
        <select name="Status" value={form.Status} onChange={handleChange}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        {error && <div className="error-msg">{error}</div>}

        <div className="form-buttons">
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save Plan"}
          </button>
          <button type="button" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>

      {/* Success box */}
      {successMessage && (
        <div className="success-box" style={{ marginTop: 16 }}>
          <div>{successMessage}</div>
          {createdLID && (
            <div style={{ marginTop: 8 }}>
              <strong>Plan ID:</strong> {createdLID}
            </div>
          )}

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            {createdLID && (
              <button onClick={() => navigate(`/teacher-dashboard/${courseId}/add-lecture?planId=${createdLID}`)}>
                Upload Lecture
              </button>
            )}
            <button
              onClick={() => {
                resetForm();
                fetchPlans();
              }}
            >
              Add Another Plan
            </button>
            <button
              onClick={() => {
                setSuccessMessage("");
                setCreatedLID(null);
                fetchPlans();
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <h3 style={{ marginTop: 24 }}>Existing Lecture Plans</h3>

      <div style={styles.planList}>
        {plans.length === 0 && <div style={{ color: "#666" }}>No lecture plans yet.</div>}

        {plans.map((p) => (
          <div key={p.LID} style={styles.planItem}>
            <div style={styles.left}>
              <div>
                <div style={styles.title}>{p.Content}</div>
                <div style={styles.meta}>
                  Alloc: <strong>{p.AllocationID ?? allocationId ?? "N/A"}</strong>
                </div>
              </div>
              <div
                style={{
                  ...styles.badge,
                  background: p.Status === "Active" ? "#e6ffed" : "#fff3e6",
                  color: p.Status === "Active" ? "#0a8a2a" : "#a96300",
                }}
              >
                {p.Status}
              </div>
            </div>

            <div style={{ position: "relative" }}>
              <button
                style={styles.menuBtn}
                onClick={() => setOpenMenuId((id) => (id === p.LID ? null : p.LID))}
                aria-label="Open menu"
                title="Options"
              >
                ⋮
              </button>

              {openMenuId === p.LID && (
                <div style={styles.menu}>
                  <div
                    style={styles.menuItem}
                    onClick={() => navigate(`/teacher-dashboard/${courseId}/edit-lecture-plan/${p.LID}`)}
                  >
                    Edit
                  </div>
                  <div
                    style={{ ...styles.menuItem, borderTop: "1px solid #eee", color: "#c00" }}
                    onClick={() => handleDelete(p)}
                  >
                    Delete
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editingPlan && (
        <div style={styles.modalOverlay} onClick={() => cancelEdit()}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Edit Lecture Plan</h3>

            <label style={{ display: "block", marginTop: 8 }}>Content</label>
            <input
              value={editingPlan.Content}
              onChange={(e) => setEditingPlan((s) => ({ ...s, Content: e.target.value }))}
            />

            <label style={{ display: "block", marginTop: 8 }}>Status</label>
            <select
              value={editingPlan.Status}
              onChange={(e) => setEditingPlan((s) => ({ ...s, Status: e.target.value }))}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button onClick={saveEdit} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </button>
              <button onClick={cancelEdit}>Cancel</button>
            </div>

            {error && <div className="error-msg" style={{ marginTop: 10 }}>{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
