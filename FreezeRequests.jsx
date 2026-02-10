import React, { useEffect, useState } from "react";
import axios from "axios";
import "./FreezeRequests.css"; // We'll add styles here

export default function FreezeRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_BASE =
    import.meta?.env?.VITE_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:5000";

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/admin/course-freeze`);
      setRequests(res.data || []);
    } catch (err) {
      console.error("Failed to fetch freeze requests:", err);
      alert("Could not load freeze requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (freezeId, action) => {
    try {
      const res = await axios.put(
        `${API_BASE}/api/admin/course-freeze/${freezeId}/${action}`
      );
      alert(res.data?.message || "Action completed");
      fetchRequests();
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
      alert("Action failed.");
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) return <div className="loading">Loading requests...</div>;

  return (
    <div className="freeze-requests-container">
      <h2>Course Freeze Requests</h2>
      {requests.length === 0 ? (
        <p>No requests found.</p>
      ) : (
        <table className="freeze-table">
          <thead>
            <tr>
              <th>Freeze ID</th>
              <th>Student</th>
              <th>Course</th>
              <th>Weeks</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.FreezeID}>
                <td>{req.FreezeID}</td>
                <td>{req.StudentID}</td>
                <td>{req.CourseName}</td>
                <td>
                  {req.StartWeek} - {req.EndWeek}
                </td>
                <td>{req.DurationWeeks} weeks</td>
                <td className={`status ${req.Status.toLowerCase()}`}>
                  {req.Status}
                </td>
                <td>
                  {req.Status === "Pending" ? (
                    <div className="actions">
                      <button
                        className="btn-approve"
                        onClick={() => handleAction(req.FreezeID, "approve")}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleAction(req.FreezeID, "reject")}
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span>{req.Status}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
