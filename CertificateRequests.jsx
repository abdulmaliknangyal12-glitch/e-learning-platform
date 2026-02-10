// src/pages/CertificateRequests.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./CertificateRequests.css";

const CertificateRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all certificate requests
  const fetchRequests = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/certificates/all");
      setRequests(res.data);
    } catch (err) {
      console.error("Error fetching certificate requests:", err);
    } finally {
      setLoading(false);
    }
  };

  // Approve or reject a request
  const handleAction = async (enrollId, action) => {
    try {
      await axios.post(`http://localhost:5000/api/admin/certificates/${enrollId}`, { action });
      fetchRequests(); // refresh list
    } catch (err) {
      console.error("Error updating certificate status:", err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) return <p>Loading certificate requests...</p>;

  return (
    <div className="certificate-requests-container">
      <h2>📜 Certificate Requests</h2>
      {requests.length === 0 ? (
        <p className="no-requests">No certificate requests found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="styled-table">
            <thead>
              <tr>
                <th>Enroll ID</th>
                <th>Student</th>
                <th>Course</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.EnrollID}>
                  <td>{req.EnrollID}</td>
                  <td>{req.FName} {req.LName}</td>
                  <td>{req.CourseName}</td>
                  <td>
                    <span className={`status-badge ${req.CertificateStatus?.toLowerCase()}`}>
                      {req.CertificateStatus}
                    </span>
                  </td>
                  <td>{req.S_Date ? new Date(req.S_Date).toLocaleDateString() : "-"}</td>
                  <td>{req.End_Date ? new Date(req.End_Date).toLocaleDateString() : "-"}</td>
                  <td>
                    <button 
                      className="approve-btn"
                      onClick={() => handleAction(req.EnrollID, "approve")} 
                      disabled={req.CertificateStatus === "Issued"}
                    >
                      ✅ Approve
                    </button>
                    <button 
                      className="reject-btn"
                      onClick={() => handleAction(req.EnrollID, "reject")} 
                      disabled={req.CertificateStatus === "Rejected"}
                    >
                      ❌ Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CertificateRequests;
