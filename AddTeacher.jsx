// src/pages/Admin/AddTeacher.jsx
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaUserCircle } from "react-icons/fa";
import "./AddTeacher.css";

const AddTeacher = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    FName: "",
    LName: "",
    FatherName: "",
    DOB: "",
    Email: "",
    PhoneNo: "",
    Password: "",
    CNIC: "",
    City: "",
    Picture: null,
    Salary: "",
    Qualifications: [""],
  });

  const [preview, setPreview] = useState(null);

  // Format CNIC with hyphens (xxxxx-xxxxxxx-x)
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

  // Handle input change
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "Picture") {
      const file = files[0];
      setFormData((prev) => ({ ...prev, Picture: file }));
      setPreview(file ? URL.createObjectURL(file) : null);
    } else if (name === "CNIC") {
      setFormData((prev) => ({ ...prev, CNIC: formatCNIC(value) }));
    } else if (name === "PhoneNo") {
      const digits = value.replace(/\D/g, "").slice(0, 11);
      setFormData((prev) => ({ ...prev, PhoneNo: digits }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Qualifications handlers
  const handleQualificationChange = (index, value) => {
    const updated = [...formData.Qualifications];
    updated[index] = value;
    setFormData((prev) => ({ ...prev, Qualifications: updated }));
  };

  const addQualificationField = () => {
    setFormData((prev) => ({
      ...prev,
      Qualifications: [...prev.Qualifications, ""],
    }));
  };

  const removeQualificationField = (index) => {
    setFormData((prev) => ({
      ...prev,
      Qualifications: prev.Qualifications.filter((_, i) => i !== index),
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    const cnicPattern = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
    if (!cnicPattern.test(formData.CNIC)) {
      alert("❌ CNIC must be in format 12345-1234567-1");
      return;
    }

    if (formData.PhoneNo.length !== 11) {
      alert("❌ Phone number must be exactly 11 digits");
      return;
    }

    // Validate DOB (must be in the past and teacher must be >= 18 years old)
    const today = new Date();
    const enteredDOB = new Date(formData.DOB);

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

    try {
      const formDataToSend = new FormData();

      Object.keys(formData).forEach((key) => {
        if (key === "Qualifications" || key === "Picture") return;
        formDataToSend.append(key, formData[key]);
      });

      if (formData.Picture) {
        formDataToSend.append("Picture", formData.Picture);
      }

      formData.Qualifications.forEach((q, index) => {
        if (q && q.trim())
          formDataToSend.append(`Qualifications[${index}]`, q.trim());
      });

      await axios.post("http://localhost:5000/api/teachers", formDataToSend);

      alert("✅ Teacher added successfully!");
      navigate("/dashboard/teachers");
    } catch (error) {
      console.error("Error adding teacher:", error);
      alert("❌ Failed to add teacher");
    }
  };

  return (
    <div className="add-teacher-container">
      <h2>Add New Teacher</h2>

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
        <p className="upload-text">Click to upload picture</p>
      </div>

      <form
        className="add-teacher-form"
        onSubmit={handleSubmit}
        encType="multipart/form-data"
      >
        <div className="form-column">
          <label>
            First Name:
            <input
              name="FName"
              value={formData.FName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Last Name:
            <input
              name="LName"
              value={formData.LName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Father&apos;s Name:
            <input
              name="FatherName"
              value={formData.FatherName}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Date of Birth:
            <input
              type="date"
              name="DOB"
              value={formData.DOB}
              onChange={handleChange}
              required
              max={new Date().toISOString().split("T")[0]} // prevent selecting future dates
            />
          </label>

          <label>
            Email:
            <input
              type="email"
              name="Email"
              value={formData.Email}
              onChange={handleChange}
              autoComplete="off"
              required
            />
          </label>

          <label>
            Phone Number (11 digits):
            <input
              name="PhoneNo"
              value={formData.PhoneNo}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Password:
            <input
              type="password"
              name="Password"
              value={formData.Password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </label>

          <label>
            CNIC (12345-1234567-1):
            <input
              name="CNIC"
              value={formData.CNIC}
              onChange={handleChange}
              required
              title="CNIC format must be 12345-1234567-1"
            />
          </label>

          <label>
            City:
            <input
              name="City"
              value={formData.City}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Salary:
            <input
              type="number"
              name="Salary"
              value={formData.Salary}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        {/* Qualifications Section */}
        <div className="qualifications-section">
          <label>Qualifications:</label>
          {formData.Qualifications.map((qualification, index) => (
            <div key={index} className="qualification-field">
              <input
                type="text"
                value={qualification}
                onChange={(e) =>
                  handleQualificationChange(index, e.target.value)
                }
                required
              />
              {formData.Qualifications.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQualificationField(index)}
                  className="remove-btn"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addQualificationField}
            className="add-qualification-btn"
          >
            + Add Qualification
          </button>
        </div>

        <button type="submit" className="submit-btn">
          Add Teacher
        </button>
      </form>
    </div>
  );
};

export default AddTeacher;
