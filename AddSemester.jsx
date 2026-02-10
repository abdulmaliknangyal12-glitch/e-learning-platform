import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddSemester.css';

const AddSemester = () => {
  const [semesterName, setSemesterName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('Active');
  const navigate = useNavigate();

  const handleAddSemester = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/semesters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          SemesterName: semesterName,
          S_StartDate: startDate,
          S_EndDate: endDate,
          S_Status: status,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        alert('✅ Semester added successfully!');
        navigate('/dashboard/view-semesters'); // ✅ redirect to ViewSemesters
      } else {
        alert(`❌ Failed: ${result.message}`);
      }
    } catch (err) {
      console.error('❌ Error:', err);
      alert('❌ Server error. Please try again later.');
    }
  };

  return (
    <div className="add-semester-container">
      <h2>Add New Semester</h2>
      <form className="semester-form">
        <label>
          Semester Name:
          <input
            type="text"
            value={semesterName}
            onChange={(e) => setSemesterName(e.target.value)}
          />
        </label>
        <label>
          Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label>
          End Date:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
        <label>
          Status:
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </label>
        <button type="button" onClick={handleAddSemester}>
          Add Semester
        </button>
      </form>
    </div>
  );
};

export default AddSemester;
