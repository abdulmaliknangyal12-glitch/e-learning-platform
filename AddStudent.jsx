// src/pages/Admin/AddStudent.jsx
import React, { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AddStudent.css";

const formatCNIC = (raw) => {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  const part1 = digits.substring(0, 5);
  const part2 = digits.substring(5, 12); // next 7
  const part3 = digits.substring(12, 13); // last 1
  let formatted = part1;
  if (part2.length) formatted += "-" + part2;
  if (part3.length) formatted += "-" + part3;
  return formatted;
};

const AddStudent = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    dob: "",
    father: "",
    cnic: "",
    city: "",
    phone: "",
  });

  const [picture, setPicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // validation state
  const [errors, setErrors] = useState({
    cnic: "",
    phone: "",
    email: "",
    password: "",
    dob: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "cnic") {
      const formatted = formatCNIC(value);
      setForm((p) => ({ ...p, cnic: formatted }));

      const cnicPattern = /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/;
      setErrors((prev) => ({
        ...prev,
        cnic: cnicPattern.test(formatted)
          ? ""
          : "CNIC must be in format 12345-1234567-1",
      }));
      return;
    }

    if (name === "phone") {
      const digits = value.replace(/\D/g, "");
      setForm((p) => ({ ...p, phone: digits }));

      if (digits.length > 0 && digits.length < 11) {
        setErrors((prev) => ({
          ...prev,
          phone: "Phone must be 11 digits (e.g. 03XXXXXXXXX)",
        }));
      } else {
        setErrors((prev) => ({ ...prev, phone: "" }));
      }
      return;
    }

    if (name === "email") {
      setForm((p) => ({ ...p, email: value }));
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      setErrors((prev) => ({
        ...prev,
        email: emailOk || value === "" ? "" : "Enter a valid email",
      }));
      return;
    }

    if (name === "password") {
      setForm((p) => ({ ...p, password: value }));
      setErrors((prev) => ({
        ...prev,
        password:
          value.length >= 6 || value === ""
            ? ""
            : "Password must be at least 6 characters",
      }));
      return;
    }

    if (name === "dob") {
      setForm((p) => ({ ...p, dob: value }));

      if (value) {
        const today = new Date();
        const dobDate = new Date(value);

        if (dobDate > today) {
          setErrors((prev) => ({
            ...prev,
            dob: "Date of Birth cannot be in the future",
          }));
        } else {
          let age = today.getFullYear() - dobDate.getFullYear();
          const m = today.getMonth() - dobDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
            age--;
          }

          if (age < 15) {
            setErrors((prev) => ({
              ...prev,
              dob: "Student must be at least 15 years old",
            }));
          } else {
            setErrors((prev) => ({ ...prev, dob: "" }));
          }
        }
      }
      return;
    }

    setForm((p) => ({ ...p, [name]: value }));
  };

  const handlePictureChange = (e) => {
    const file = e.target.files && e.target.files[0];
    setPicture(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const validateBeforeSubmit = () => {
    const newErrors = { cnic: "", phone: "", email: "", password: "", dob: "" };

    if (!/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(form.cnic)) {
      newErrors.cnic = "CNIC must be in format 12345-1234567-1";
    }

    const phoneDigits = String(form.phone || "").replace(/\D/g, "");
    if (phoneDigits.length !== 11) {
      newErrors.phone = "Phone must be 11 digits (e.g. 03XXXXXXXXX)";
    } else if (!/^03[0-9]{9}$/.test(phoneDigits)) {
      newErrors.phone = "Phone must start with 03 and have 11 digits";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!form.password || form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!form.dob) {
      newErrors.dob = "Date of Birth is required";
    } else {
      const today = new Date();
      const dobDate = new Date(form.dob);
      if (dobDate > today) {
        newErrors.dob = "Date of Birth cannot be in the future";
      } else {
        let age = today.getFullYear() - dobDate.getFullYear();
        const m = today.getMonth() - dobDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
          age--;
        }
        if (age < 15) {
          newErrors.dob = "Student must be at least 15 years old";
        }
      }
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((v) => v);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateBeforeSubmit()) {
      alert("Please fix validation errors before submitting.");
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("password", form.password);
    formData.append("dob", form.dob);
    formData.append("father", form.father);
    formData.append("cnic", form.cnic);
    formData.append("city", form.city);
    formData.append("phone", form.phone);

    if (picture) formData.append("profilePicture", picture);

    try {
      await axios.post("http://localhost:5000/api/students", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Student added successfully");
      navigate("/dashboard/students");
    } catch (err) {
      console.error("Failed to add student:", err);
      alert("Something went wrong.");
    }
  };

  return (
    <div className="add-student-container">
      <button className="back-button" onClick={() => navigate(-1)}>
        ←
      </button>
      <h2 className="title">Add Student</h2>

      <form
        className="student-form"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <input
          type="text"
          name="fake-username"
          autoComplete="username"
          style={{ display: "none" }}
        />
        <input
          type="password"
          name="fake-password"
          autoComplete="new-password"
          style={{ display: "none" }}
        />

        <div
          className="profile-upload"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          style={{ cursor: "pointer" }}
        >
          <label htmlFor="profile-upload-input" className="profile-circle">
            {previewUrl ? <img src={previewUrl} alt="Preview" /> : <span>+</span>}
          </label>
          <input
            id="profile-upload-input"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePictureChange}
            style={{ display: "none" }}
          />
          <p className="profile-label">Add Profile Picture</p>
        </div>

        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          type="text"
          placeholder="Enter Full Name"
          required
          autoComplete="name"
        />

        <label htmlFor="cnic">CNIC</label>
        <input
          id="cnic"
          name="cnic"
          value={form.cnic}
          onChange={handleChange}
          type="text"
          placeholder="12345-1234567-1"
          required
          maxLength={15}
          inputMode="numeric"
          autoComplete="off"
        />
        {errors.cnic && <div className="field-error">{errors.cnic}</div>}

        <label htmlFor="dob">Date Of Birth</label>
        <input
          id="dob"
          name="dob"
          value={form.dob}
          onChange={handleChange}
          type="date"
          required
          autoComplete="bday"
        />
        {errors.dob && <div className="field-error">{errors.dob}</div>}

        <label htmlFor="father">Father Name</label>
        <input
          id="father"
          name="father"
          value={form.father}
          onChange={handleChange}
          type="text"
          placeholder="Father Name"
          required
          autoComplete="organization"
        />

        <label htmlFor="city">City</label>
        <input
          id="city"
          name="city"
          value={form.city}
          onChange={handleChange}
          type="text"
          placeholder="City"
          required
          autoComplete="address-level2"
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          type="email"
          placeholder="Email"
          required
          autoComplete="new-email"
        />
        {errors.email && <div className="field-error">{errors.email}</div>}

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          type="password"
          placeholder="Password"
          required
          autoComplete="new-password"
        />
        {errors.password && <div className="field-error">{errors.password}</div>}

        <label htmlFor="phone">Phone Number</label>
        <input
          id="phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          type="text"
          placeholder="03XXXXXXXXX"
          required
          maxLength={11}
          inputMode="numeric"
          autoComplete="tel"
        />
        {errors.phone && <div className="field-error">{errors.phone}</div>}

        <button type="submit" className="add-button">
          Add
        </button>
      </form>
    </div>
  );
};

export default AddStudent;
