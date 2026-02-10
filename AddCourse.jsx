import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddCourse.css';

export default function AddCourse() {
  const [courseName, setCourseName] = useState('');
  const [duration, setDuration] = useState(''); // duration is Cduration
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Active');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!courseName || !duration || !description || !status) {
      alert('❌ Please fill in all fields');
      return;
    }

    // 🔹 Payload keys must match backend exactly
    const payload = {
      CourseName: courseName.trim(),
      Cduration: duration, // must match backend column name
      Description: description.trim(),
      Status: status.trim(),
    };

    console.log('🔹 Sending payload:', payload); // 🔍 debug

    try {
      const res = await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      console.log('🔹 Response:', data);

      if (res.ok && data.success) {
        alert('✅ Course added successfully');
        navigate('/dashboard/courses');
      } else {
        alert(data.message || '❌ Failed to add course');
      }
    } catch (err) {
      console.error('❌ Error:', err);
      alert('❌ Server error occurred');
    }
  };

  return (
    <div className="add-course-container">
      <h2>Add Course</h2>
      <form onSubmit={handleSubmit}>
        <label>Course Name</label>
        <input
          type="text"
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          required
        />

        <label>Duration</label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          required
        >
          <option value="">Select Duration</option>
          <option value="4 Weeks">4 Weeks</option>
          <option value="8 Weeks">8 Weeks</option>
          <option value="12 Weeks">12 Weeks</option>
          <option value="16 Weeks">16 Weeks</option>
        </select>

        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} required>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <button type="submit">Add Course</button>
      </form>
    </div>
  );
}
