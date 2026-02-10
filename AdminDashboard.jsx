import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserGraduate, FaChalkboardTeacher, FaBook, FaCalendarAlt } from 'react-icons/fa';
import { Link } from "react-router-dom";
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    studentCount: 0,
    teacherCount: 0,
    courseCount: 0,
    semesterCount: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:5000/api/admin/dashboard-stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error('❌ Failed to fetch stats:', err));
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="dashboard-card" onClick={() => navigate('/dashboard/students')}>
        <div className="card-icon"><FaUserGraduate /></div>
        <h3>Students</h3>
        <p>{stats.studentCount}</p>
      </div>

      <div className="dashboard-card" onClick={() => navigate('/dashboard/courses')}>
        <div className="card-icon"><FaBook /></div>
        <h3> Courses</h3>
        <p>{stats.courseCount}</p>
      </div>

      <div className="dashboard-card" onClick={() => navigate('/dashboard/teachers')}>
        <div className="card-icon"><FaChalkboardTeacher /></div>
        <h3>Teachers</h3>
        <p>{stats.teacherCount}</p>
      </div>

   
    </div>
  );
};

export default AdminDashboard;
