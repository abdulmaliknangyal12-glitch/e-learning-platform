// src/pages/StudentCertificates.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiDownload } from 'react-icons/fi';

export default function StudentCertificates() {
  const studentId = Number(localStorage.getItem('studentId'));
  const [certificates, setCertificates] = useState([]);

  const fetchCertificates = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/certificates/student/${studentId}`);
      setCertificates(res.data);
    } catch (err) {
      console.error('Failed to fetch certificates', err);
    }
  };

  useEffect(() => { fetchCertificates(); }, []);

  const statusColor = (status) => {
    switch (status) {
      case 'Issued': return '#059669';      // green
      case 'NotRequested': return '#f59e0b'; // orange
      case 'Pending': return '#2563eb';      // blue
      default: return '#6b7280';            // gray
    }
  };

  return (
    <div style={{ padding: '1rem', maxWidth: 1000, margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 700 }}>My Certificates</h2>

      {certificates.length === 0 ? (
        <p>No certificates found.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {certificates.map(cert => (
            <div
              key={cert.EnrollID}
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '16px',
                background: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 140,
              }}
            >
              <div>
                <h3 style={{ marginBottom: 8, fontSize: '1.1rem', fontWeight: 600 }}>Course: {cert.CourseName ?? cert.CourseID}</h3>
                <p style={{ fontSize: 14, color: statusColor(cert.CertificateStatus), fontWeight: 600 }}>
                  Status: {cert.CertificateStatus}
                </p>
              </div>

              <div style={{ marginTop: 12 }}>
                {cert.CertificateStatus === 'Issued' ? (
                  <a
                    href={`http://localhost:5000/api/certificates/download/${cert.EnrollID}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 12px',
                      background: '#2563eb',
                      color: '#fff',
                      borderRadius: 8,
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                  >
                    <FiDownload /> Download
                  </a>
                ) : (
                  <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Not available</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
