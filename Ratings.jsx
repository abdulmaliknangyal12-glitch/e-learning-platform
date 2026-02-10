import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaStar } from "react-icons/fa"; // For star icons
import "./Ratings.css"; // separate CSS file

export default function Ratings() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/admin/ratings");
        setRatings(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch admin ratings:", err);
        setError("Failed to load ratings");
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, []);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar
          key={i}
          className={`inline-block ${i <= rating ? "text-yellow-400" : "text-gray-300"}`}
        />
      );
    }
    return stars;
  };

  if (loading)
    return <p className="text-center mt-6 text-lg">Loading ratings...</p>;
  if (error)
    return <p className="text-center text-red-500 mt-6 text-lg">{error}</p>;

  return (
    <div className="ratings-container p-6 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-center">All Ratings & Reviews</h2>

      {ratings.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">No ratings submitted yet.</p>
      ) : (
        <div className="space-y-6">
          {ratings.map((item, index) => (
            <div
              key={index}
              className="rating-card p-6 border rounded-2xl shadow-lg bg-white hover:shadow-2xl transition-shadow duration-300"
            >
              <h3 className="font-semibold text-2xl mb-2">{item.CourseName}</h3>
              <p className="text-sm text-gray-500 mb-1">
                <strong>Student:</strong> {item.StudentName}
              </p>
              <p className="text-sm text-gray-500 mb-3">
                <strong>Teacher:</strong> {item.TeacherName}
              </p>

              <div className="mb-3">{renderStars(item.Rating)}</div>

              <p className="italic text-gray-700 text-lg mb-4">“{item.Review}”</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
