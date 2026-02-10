import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './AddAssignment.css';

const AddAssignment = () => {
  const { courseId, lectureId } = useParams();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [marks, setMarks] = useState('');
  const [status, setStatus] = useState('Active');
  const [weekNumber, setWeekNumber] = useState('');
  const [error, setError] = useState('');
  const [allocationId, setAllocationId] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch AllocationID for this teacher + course
  useEffect(() => {
    const storedTid = localStorage.getItem('tId');
    if (!storedTid) {
      alert('❌ You must be logged in to upload assignments.');
      navigate('/teacher-login');
      return;
    }

    const Tid = parseInt(storedTid, 10);

    const fetchAllocationId = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/teacher/allocation/${Tid}/${courseId}`
        );

        if (res.data?.allocationId) {
          setAllocationId(res.data.allocationId);
        } else {
          alert('❌ Could not find your allocation for this course.');
          navigate('/teacher-dashboard');
        }
      } catch (err) {
        console.error('Failed to fetch AllocationID:', err);
        alert('❌ Could not fetch allocation info. Please try again.');
        navigate('/teacher-dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchAllocationId();
  }, [courseId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!file) return setError('❌ Please upload a PDF file.');
    const parsedMarks = parseInt(marks, 10);
    if (!marks || isNaN(parsedMarks) || parsedMarks <= 0)
      return setError('❌ Please enter valid marks.');
    if (!weekNumber) return setError('❌ Please select a week number.');
    if (!allocationId) return setError('❌ AllocationID not loaded yet.');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('T_Marks', parsedMarks);
      formData.append('Status', status);
      formData.append('AllocationID', allocationId);
      formData.append('WeekNumber', weekNumber);
      if (lectureId) formData.append('LectureID', lectureId);

      await axios.post(
        'http://localhost:5000/api/teacher/assignments/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      alert('✅ Assignment uploaded successfully!');
      navigate(`/teacher-dashboard/${courseId}/details`);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || '❌ Failed to upload assignment.');
    }
  };

  if (loading) return <p>Loading allocation info...</p>;

  return (
    <div className="assignment-upload-container">
      <h2>Upload Assignment</h2>
      {error && <p className="error-msg">{error}</p>}

      <form onSubmit={handleSubmit} className="assignment-form">
        <div className="form-row">
          <label>
            Total Marks:
            <input
              type="number"
              value={marks}
              onChange={(e) => setMarks(e.target.value)}
              required
              min={1}
            />
          </label>

          <label>
            Status:
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </label>

          <label>
            Week Number:
            <select
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
              required
            >
              <option value="">Select Week</option>
              {Array.from({ length: 16 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Week {i + 1}
                </option>
              ))}
            </select>
          </label>

          <label>
            Course ID:
            <input type="number" value={courseId} disabled />
          </label>
        </div>

        <label>
          Upload PDF File:
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files[0] || null)}
            required
          />
        </label>

        <div className="form-buttons">
          <button type="submit" disabled={!allocationId}>
            Upload Assignment
          </button>
          <button type="button" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddAssignment;
