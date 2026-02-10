import React, { useEffect, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import TeacherCard from "../Components/TeacherCard";
import './Teachers.css';

const Teachers = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/teachers/all");
        const data = await res.json();

        if (res.ok) {
          const formattedData = data.map(t => ({
            ...t,
            Qualifications: Array.isArray(t.Qualifications) ? t.Qualifications : []
          }));
          setTeachers(formattedData);
          setError(null);
        } else {
          setTeachers([]);
          setError(data.error || "Failed to fetch teachers");
        }
      } catch (err) {
        setTeachers([]);
        setError("Server connection failed.");
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const filteredTeachers = Array.isArray(teachers)
    ? teachers.filter((t) => {
        const fullName = `${t.FName ?? ""} ${t.LName ?? ""}`.toLowerCase();
        return fullName.includes(search.toLowerCase());
      })
    : [];

  return (
    <div className="teachers-container">
      <div className="teachers-header">
        <h1>Teachers</h1>
        <button className="add-button" onClick={() => navigate('/dashboard/teachers/add')}>
          <FiPlus size={18} /><span>+</span>
        </button>
      </div>

      <input
        type="text"
        placeholder="Search here..."
        className="search-box"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="teacher-list">
        {loading ? (
          <p style={{ textAlign: "center", marginTop: "2rem" }}>Loading...</p>
        ) : error ? (
          <p style={{ textAlign: "center", marginTop: "2rem", color: "red" }}>
            ❌ {error}
          </p>
        ) : filteredTeachers.length === 0 ? (
          <p style={{ textAlign: "center", marginTop: "2rem" }}>No teachers found.</p>
        ) : (
          filteredTeachers.map((teacher, index) => (
            <TeacherCard
              key={teacher.Uid ?? index}
              name={`${teacher.FName ?? ""} ${teacher.LName ?? ""}`}
              degree={teacher.Qualifications.length > 0 ? teacher.Qualifications.join(", ") : "N/A"}
              image={teacher.Picture ?? `https://randomuser.me/api/portraits/lego/${teacher.Uid % 10}.jpg`}
              id={teacher.Uid}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Teachers;
