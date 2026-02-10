import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Components/Navbar';
import Sidebar from '../Components/Sidebar';
import { Outlet } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <Navbar />
        <main className="content-area">
          <h2></h2>
          <Outlet /> {/* ✅ Renders AdminDashboard */}
        </main>
        <p className="impact-message">
          Teaching is a work of heart. You’re making an impact with every course.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
