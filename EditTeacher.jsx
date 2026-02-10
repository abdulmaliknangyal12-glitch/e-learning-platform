// src/pages/EditTeacher.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import "./EditTeacher.css";

const EditTeacher = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [teacher, setTeacher] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/teachers/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data.Qualifications)) {
          data.Qualifications = data.Qualifications
            ? [data.Qualifications]
            : [""];
        }
        setTeacher(data);
        setPreview(data.Picture || null);
      })
      .catch(() => alert("Failed to load teacher"));
  }, [id]);

  // Helper to format CNIC
  const formatCNIC = (value) => {
    let digits = value.replace(/\D/g, "");
    if (digits.length > 5 && digits.length <= 12) {
      return digits.slice(0, 5) + "-" + digits.slice(5);
    } else if (digits.length > 12) {
      return (
        digits.slice(0, 5) +
        "-" +
        digits.slice(5, 12) +
        "-" +
        digits.slice(12, 13)
      );
    }
    return digits;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "Picture") {
      const file = files[0];
      if (file) {
        setTeacher({ ...teacher, Picture: file });
        setPreview(URL.createObjectURL(file));
      }
    } else if (name === "CNIC") {
      setTeacher({ ...teacher, CNIC: formatCNIC(value) });
    } else if (name === "PhoneNo") {
      const digits = value.replace(/\D/g, "").slice(0, 11);
      setTeacher({ ...teacher, PhoneNo: digits });
    } else {
      setTeacher({ ...teacher, [name]: value });
    }
  };

  const handleQualificationChange = (index, value) => {
    const updated = [...teacher.Qualifications];
    updated[index] = value;
    setTeacher({ ...teacher, Qualifications: updated });
  };

  const addQualificationField = () => {
    setTeacher({ ...teacher, Qualifications: [...teacher.Qualifications, ""] });
  };

  const removeQualificationField = (index) => {
    const updated = teacher.Qualifications.filter((_, i) => i !== index);
    setTeacher({ ...teacher, Qualifications: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cnicPattern = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
    if (!cnicPattern.test(teacher.CNIC)) {
      alert("❌ CNIC must be in format 12345-1234567-1");
      return;
    }

    if (teacher.PhoneNo.length !== 11) {
      alert("❌ Phone number must be exactly 11 digits");
      return;
    }

    // Validate DOB (must be in past and age >= 18)
    const today = new Date();
    const enteredDOB = new Date(teacher.DOB);

    if (enteredDOB >= today) {
      alert("❌ Date of Birth must be in the past");
      return;
    }

    const ageDiff = today.getFullYear() - enteredDOB.getFullYear();
    const hasHadBirthdayThisYear =
      today.getMonth() > enteredDOB.getMonth() ||
      (today.getMonth() === enteredDOB.getMonth() &&
        today.getDate() >= enteredDOB.getDate());
    const age = hasHadBirthdayThisYear ? ageDiff : ageDiff - 1;

    if (age < 18) {
      alert("❌ Teacher must be at least 18 years old");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("FName", teacher.FName);
    formDataToSend.append("LName", teacher.LName);
    formDataToSend.append("FatherName", teacher.FatherName);
    formDataToSend.append("DOB", teacher.DOB);
    formDataToSend.append("Email", teacher.Email);
    formDataToSend.append("PhoneNo", teacher.PhoneNo);
    formDataToSend.append("CNIC", teacher.CNIC);
    formDataToSend.append("City", teacher.City);
    formDataToSend.append("Salary", teacher.Salary);

    if (teacher.Picture instanceof File) {
      formDataToSend.append("Picture", teacher.Picture);
    }

    teacher.Qualifications.forEach((q, index) => {
      if (q && q.trim())
        formDataToSend.append(`Qualifications[${index}]`, q.trim());
    });

    try {
      const res = await fetch(`http://localhost:5000/api/teachers/${id}`, {
        method: "PUT",
        body: formDataToSend,
      });

      if (res.ok) {
        alert("✅ Teacher updated");
        navigate("/dashboard/teachers");
      } else {
        alert("❌ Update failed");
      }
    } catch (error) {
      alert("Server error while updating");
    }
  };

  if (!teacher) return <p>Loading...</p>;

  return (
    <div className="edit-teacher-container">
      <form className="edit-teacher-form" onSubmit={handleSubmit}>
        <h2>Edit Teacher</h2>

        {/* Profile Picture Upload */}
        <div
          className="profile-upload"
          onClick={() => fileInputRef.current.click()}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="profile-circle" />
          ) : (
            <FaUserCircle className="default-icon" />
          )}
          <input
            type="file"
            name="Picture"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleChange}
          />
          <p className="upload-text">Click to upload/change picture</p>
        </div>

        <label>First Name</label>
        <input name="FName" value={teacher.FName} onChange={handleChange} />

        <label>Last Name</label>
        <input name="LName" value={teacher.LName} onChange={handleChange} />

        <label>Father Name</label>
        <input
          name="FatherName"
          value={teacher.FatherName}
          onChange={handleChange}
        />

        <label>DOB</label>
        <input
          name="DOB"
          type="date"
          value={teacher.DOB?.split("T")[0]}
          onChange={handleChange}
          max={new Date().toISOString().split("T")[0]} // block future dates
        />

        <label>Email</label>
        <input name="Email" value={teacher.Email} onChange={handleChange} />

        <label>Phone (11 digits)</label>
        <input
          name="PhoneNo"
          value={teacher.PhoneNo}
          onChange={handleChange}
          placeholder="03XXXXXXXXX"
          required
        />

        <label>CNIC</label>
        <input
          name="CNIC"
          value={teacher.CNIC}
          onChange={handleChange}
          maxLength="15"
          required
          placeholder="12345-1234567-1"
        />

        <label>City</label>
        <input name="City" value={teacher.City} onChange={handleChange} />

        <label>Salary</label>
        <input name="Salary" value={teacher.Salary} onChange={handleChange} />

        <label>Qualifications</label>
        {teacher.Qualifications.map((q, index) => (
          <div
            key={index}
            style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}
          >
            <input
              type="text"
              value={q}
              onChange={(e) => handleQualificationChange(index, e.target.value)}
              required
            />
            {teacher.Qualifications.length > 1 && (
              <button
                type="button"
                onClick={() => removeQualificationField(index)}
                style={{
                  background: "#ff4d4d",
                  color: "#fff",
                  border: "none",
                  padding: "0.3rem 0.5rem",
                  borderRadius: "4px",
                }}
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addQualificationField}
          style={{ marginBottom: "1rem" }}
        >
          + Add Qualification
        </button>

        <button type="submit">Update</button>
      </form>
    </div>
  );
};

export default EditTeacher;
