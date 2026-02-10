// src/pages/TeacherDashboard/AddLecture.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiArrowLeft } from "react-icons/fi";
import "./AddLecture.css";

const AddLecture = () => {
  const { courseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const query = new URLSearchParams(location.search);
  const planIdFromQuery = query.get("planId");
  const weekFromQuery = query.get("week") ? Number(query.get("week")) : null;

  const [lecturePlans, setLecturePlans] = useState([]);
  const [lecturesByWeek, setLecturesByWeek] = useState({});
  const [formData, setFormData] = useState({
    LID: planIdFromQuery || "",
    Type: "Video",
    Status: "Active",
    file: null,
    WeekNumber: weekFromQuery || 1,
  });
  const [previewURL, setPreviewURL] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [maxWeek, setMaxWeek] = useState(1);
  const prevPreviewRef = useRef(null);

  const normalizeGroupedLectures = (data) => {
    if (!data) return {};
    if (Array.isArray(data)) {
      const obj = {};
      data.forEach((entry, idx) => {
        const key = entry.week || entry.Week || entry.label || `Week ${idx + 1}`;
        const items =
          entry.lectures ||
          entry.items ||
          entry.weekLectures ||
          entry.lecturesByWeek ||
          entry.data ||
          [];
        obj[key] = Array.isArray(items) ? items : items ? [items] : [];
      });
      return obj;
    }
    if (typeof data === "object") {
      const obj = {};
      Object.entries(data).forEach(([k, v]) => {
        obj[k] = Array.isArray(v) ? v : v ? [v] : [];
      });
      return obj;
    }
    return {};
  };

  useEffect(() => {
    const Tid = Number(localStorage.getItem("tId")) || null;
    axios
      .get(`http://localhost:5000/api/teacher/lecturePlans/${courseId}`, {
        params: { Tid },
      })
      .then((res) => setLecturePlans(Array.isArray(res.data) ? res.data : []))
      .catch((err) => {
        console.error("Error loading lecture plans", err);
        setLecturePlans([]);
      });

    fetchLectures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    // if planId present in query and lecturePlans loaded, preselect it
    if (planIdFromQuery && lecturePlans.length) {
      const found = lecturePlans.find(
        (lp) =>
          String(lp.LID) === String(planIdFromQuery) ||
          String(lp.LecturePlanID) === String(planIdFromQuery)
      );
      if (found) {
        setFormData((f) => ({
          ...f,
          LID: found.LID ?? found.LecturePlanID ?? planIdFromQuery,
          WeekNumber: weekFromQuery || f.WeekNumber,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planIdFromQuery, weekFromQuery, lecturePlans]);

  const fetchLectures = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/teacher/lectures/groupedByWeek`,
        { params: { courseId } }
      );
      const normalized = normalizeGroupedLectures(res.data);
      setLecturesByWeek(normalized);
      const weekNumbers = Object.keys(normalized)
        .map((w) => {
          const m = String(w).match(/(\d+)/);
          return m ? parseInt(m[1], 10) : null;
        })
        .filter((n) => Number.isInteger(n));
      const max = weekNumbers.length ? Math.max(...weekNumbers) : 1;
      setMaxWeek(max);
      setFormData((f) => ({
        ...f,
        WeekNumber: Math.max(f.WeekNumber || 1, weekFromQuery || max + 1),
      }));
    } catch (err) {
      console.error("Error fetching lectures", err);
      setLecturesByWeek({});
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "WeekNumber") {
      const parsed = parseInt(value, 10);
      setFormData((f) => ({ ...f, [name]: Number.isNaN(parsed) ? "" : parsed }));
      return;
    }
    if (name === "LID") {
      const selected = lecturePlans.find(
        (lp) =>
          String(lp.LID) === String(value) ||
          String(lp.LecturePlanID) === String(value)
      );
      const inferredWeekMatch = selected
        ? String(selected.Content || selected.LectureTitle || selected.Title || "").match(
            /Week\s*([0-9]+)/i
          )
        : null;
      const inferredWeek = inferredWeekMatch ? Number(inferredWeekMatch[1]) : null;
      setFormData((f) => ({ ...f, LID: value, WeekNumber: inferredWeek || f.WeekNumber }));
      return;
    }
    setFormData((f) => ({ ...f, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    setFormData((f) => ({ ...f, file }));
    if (prevPreviewRef.current) {
      URL.revokeObjectURL(prevPreviewRef.current);
      prevPreviewRef.current = null;
    }
    if (file) {
      const url = URL.createObjectURL(file);
      prevPreviewRef.current = url;
      setPreviewURL(url);
    } else {
      setPreviewURL(null);
    }
  };

  useEffect(() => {
    return () => {
      if (prevPreviewRef.current) URL.revokeObjectURL(prevPreviewRef.current);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { LID, Type, Status, file, WeekNumber } = formData;
    if (!LID || !file) return setError("Please select a Lecture Plan and attach a file.");

    const data = new FormData();
    data.append("LID", LID);
    data.append("Type", Type);
    data.append("Status", Status);
    data.append("WeekNumber", WeekNumber);
    data.append("file", file);
    data.append("courseId", courseId);

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/teacher/lectures", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const weekInfo = res?.data?.week ?? WeekNumber;
      const lecInfo = res?.data?.lecture ?? res?.data?.LID ?? "";
      alert(`✅ Lecture uploaded successfully — week ${weekInfo}, lecture ${lecInfo}`);
      setFormData({ LID: "", Type: "Video", Status: "Active", file: null, WeekNumber: maxWeek + 1 });
      setPreviewURL(null);
      setError("");
      await fetchLectures();
    } catch (err) {
      console.error("Upload error", err);
      setError(err?.response?.data?.message || "❌ Failed to upload lecture");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-lecture-container">
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

      <div className="form-container">
        <h2>Upload Lecture Content</h2>
        {error && <p className="error-msg">{error}</p>}

        <form onSubmit={handleSubmit} className="lecture-form">
          <label>
            Lecture Plan:
            <select name="LID" value={formData.LID} onChange={handleChange} required>
              <option value="">-- Select a Lecture Plan --</option>
              {Array.isArray(lecturePlans) &&
                lecturePlans.map((lp) => {
                  const key = lp?.LID ?? lp?.LecturePlanID ?? lp?.id;
                  const label = lp?.Content ?? lp?.LectureTitle ?? lp?.Title ?? `Plan ${key}`;
                  const status = lp?.Status ?? lp?.status ?? "";
                  return (
                    <option key={key ?? label} value={key}>
                      {label} {status ? `(${status})` : ""}
                    </option>
                  );
                })}
            </select>
          </label>

          <label>
            Week Number:
            <input
              type="number"
              name="WeekNumber"
              value={formData.WeekNumber}
              min={1}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Type:
            <select name="Type" value={formData.Type} onChange={handleChange}>
              <option value="Video">Video</option>
              <option value="PDF">PDF</option>
            </select>
          </label>

          <label>
            Status:
            <select name="Status" value={formData.Status} onChange={handleChange}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>

          <label>
            Upload File:
            <input
              type="file"
              name="file"
              accept={formData.Type === "PDF" ? "application/pdf" : "video/*"}
              onChange={handleFileChange}
              required
            />
          </label>

          {previewURL && formData.Type === "Video" && <video controls width="100%" src={previewURL} />}
          {previewURL && formData.Type === "PDF" && (
            <embed src={previewURL} type="application/pdf" width="100%" height="400px" />
          )}

          <div className="form-buttons">
            <button type="submit" disabled={loading}>
              {loading ? "Uploading..." : "Upload"}
            </button>
            <button
              type="button"
              onClick={() => {
                setError("");
                setPreviewURL(null);
                // keep user on page; if you'd prefer to go back on cancel, replace below with: navigate(-1)
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLecture;
