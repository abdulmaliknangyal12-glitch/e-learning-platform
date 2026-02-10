// src/pages/StudentDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FiArrowLeft,
  FiMoreVertical,
  FiSave,
  FiX,
  FiUser,
  FiCalendar,
  FiMapPin,
  FiMail,
  FiPhone,
  FiCreditCard
} from "react-icons/fi";
import "./StudentDetail.css";

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    FName: "",
    LName: "",
    FatherName: "",
    DOB: "",
    City: "",
    Email: "",
    PhoneNo: "",
    CNIC: ""
  });

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/students/${id}`);
        setStudent(res.data);
        setFormData({
          FName: res.data.FName || "",
          LName: res.data.LName || "",
          FatherName: res.data.FatherName || "",
          DOB: res.data.DOB ? res.data.DOB.substring(0, 10) : "",
          City: res.data.City || "",
          Email: res.data.Email || "",
          PhoneNo: res.data.PhoneNo || "",
          CNIC: res.data.CNIC || ""
        });
      } catch (err) {
        console.error("Error fetching student:", err);
        navigate("/dashboard/students");
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!window.confirm("Delete this student?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/students/${id}`);
      navigate("/dashboard/students");
    } catch (err) {
      alert("Failed to delete student.");
    }
  };

  const startEdit = () => {
    setError("");
    setEditing(true);
    setShowMenu(false);
  };

  const cancelEdit = () => {
    setFormData({
      FName: student.FName || "",
      LName: student.LName || "",
      FatherName: student.FatherName || "",
      DOB: student.DOB ? student.DOB.substring(0, 10) : "",
      City: student.City || "",
      Email: student.Email || "",
      PhoneNo: student.PhoneNo || "",
      CNIC: student.CNIC || ""
    });
    setError("");
    setEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "PhoneNo") {
      // ✅ Allow only digits, max 11
      const digits = value.replace(/\D/g, "").slice(0, 11);
      setFormData((prev) => ({ ...prev, PhoneNo: digits }));
    } else if (name === "CNIC") {
      // ✅ Format CNIC: 12345-1234567-1
      let formatted = value.replace(/\D/g, "");
      if (formatted.length > 5) {
        formatted = formatted.slice(0, 5) + "-" + formatted.slice(5);
      }
      if (formatted.length > 13) {
        formatted = formatted.slice(0, 13) + "-" + formatted.slice(13, 14);
      }
      setFormData((prev) => ({ ...prev, CNIC: formatted.slice(0, 15) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

const handleSave = async (e) => {
  e.preventDefault();
  const { FName, LName, FatherName, DOB, City, Email, PhoneNo, CNIC } = formData;

  if (!FName || !LName || !FatherName || !DOB || !City || !Email || !PhoneNo || !CNIC) {
    return setError("All fields are required");
  }
  if (PhoneNo.length !== 11) {
    return setError("Phone number must be exactly 11 digits");
  }
  if (CNIC.length !== 15) {
    return setError("CNIC must be in format 12345-1234567-1");
  }

  // ✅ Age validation
  const birthDate = new Date(DOB);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--; // adjust if birthday not reached yet this year
  }
  if (age < 15) {
    return setError("Student must be at least 18 years old");
  }

  try {
    const res = await axios.put(`http://localhost:5000/api/students/${id}`, formData);
    setStudent(res.data.updated);
    setEditing(false);
  } catch (err) {
    console.error(err);
    setError(err.response?.data?.message || "Save failed");
  }
};



  if (loading) return <div>Loading…</div>;
  if (!student) return <div>Student not found or error fetching data.</div>;

  const studentImage = student.Picture
    ? `http://localhost:5000${student.Picture}`
    : "/default-profile.png";

  return (
    <div className="student-detail-container">
      <div className="header">
        <FiArrowLeft className="back" onClick={() => navigate(-1)} />
        <h2>Student Detail</h2>
        <div className="menu">
          <FiMoreVertical onClick={() => setShowMenu((s) => !s)} />
          {showMenu && (
            <div className="dropdown">
              <button onClick={startEdit}>✏️ Edit</button>
              <button onClick={handleDelete}>🗑 Delete</button>
            </div>
          )}
        </div>
      </div>

      {editing ? (
        <form className="edit-form" onSubmit={handleSave}>
          {error && <p className="error">{error}</p>}
          <label>First Name
            <input name="FName" value={formData.FName} onChange={handleChange} required />
          </label>
          <label>Last Name
            <input name="LName" value={formData.LName} onChange={handleChange} required />
          </label>
          <label>Father Name
            <input name="FatherName" value={formData.FatherName} onChange={handleChange} required />
          </label>
          <label>DOB
            <input type="date" name="DOB" value={formData.DOB} onChange={handleChange} required />
          </label>
          <label>City
            <input name="City" value={formData.City} onChange={handleChange} required />
          </label>
          <label>Email
            <input type="email" name="Email" value={formData.Email} onChange={handleChange} required />
          </label>
          <label>Phone
            <input
              name="PhoneNo"
              value={formData.PhoneNo}
              onChange={handleChange}
              required
              placeholder="03XXXXXXXXX"
              maxLength="11"
            />
          </label>
          <label>CNIC
            <input
              name="CNIC"
              value={formData.CNIC}
              onChange={handleChange}
              required
              placeholder="12345-1234567-1"
              maxLength="15"
            />
          </label>
          <div className="buttons">
            <button type="submit"><FiSave /> Save</button>
            <button type="button" onClick={cancelEdit}><FiX /> Cancel</button>
          </div>
        </form>
      ) : (
        <div className="detail-view">
          <img src={studentImage} alt="Student" className="student-photo" />
          <h3>{student.FName} {student.LName}</h3>
          <p><FiUser className="icon" /> Father Name: {student.FatherName}</p>
          <p><FiCalendar className="icon" /> DOB: {student.DOB?.substring(0, 10)}</p>
          <p><FiMapPin className="icon" /> City: {student.City}</p>
          <p><FiMail className="icon" /> Email: {student.Email}</p>
          <p><FiPhone className="icon" /> Phone: {student.PhoneNo}</p>
          <p><FiCreditCard className="icon" /> CNIC: {student.CNIC}</p>

          {student.CourseName && (
            <>
              <hr />
              <h4>📚 Enrolled Course</h4>
              <p><strong>Course Name:</strong> {student.CourseName}</p>
              <p><strong>Start Date:</strong> {student.S_StartDate?.substring(0, 10)}</p>
              <p><strong>End Date:</strong> {student.S_EndDate?.substring(0, 10)}</p>
              <p><strong>Instructor:</strong> {student.TeacherName}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentDetail;
