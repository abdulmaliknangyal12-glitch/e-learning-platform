// frontend/src/components/QuizDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './QuizDetails.css';

export default function QuizDetails() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);

        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Not authenticated');
          setLoading(false);
          return;
        }

        // Correct backend route + auth headers
        const res = await axios.get(
          `http://localhost:5000/api/teacher/quizzes/${quizId}/details`,
          {
            withCredentials: true,
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setQuiz(res.data.quiz || res.data);
        setError('');
      } catch (err) {
        console.error('Error fetching quiz details:', err);
        setError(
          err.response?.data?.message || 'Failed to load quiz details'
        );
      } finally {
        setLoading(false);
      }
    };

    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  if (loading) {
    return <div className="quiz-details-loading">Loading quiz details...</div>;
  }

  if (error) {
    return <div className="quiz-details-error">{error}</div>;
  }

  if (!quiz) {
    return <div className="quiz-details-empty">Quiz not found.</div>;
  }

  return (
    <div className="quiz-details-container">
      <h1 className="quiz-title">{quiz.title || 'Untitled Quiz'}</h1>
      {quiz.questions && quiz.questions.length > 0 ? (
        <div className="quiz-questions">
          {quiz.questions.map((q, index) => (
            <div key={index} className="quiz-question-card">
              <h3>
                Q{index + 1}: {q.question}
              </h3>
              <ul>
                {q.options?.map((opt, i) => (
                  <li
                    key={i}
                    className={
                      q.correctAnswer === opt ? 'correct-answer' : ''
                    }
                  >
                    {opt}
                  </li>
                ))}
              </ul>
              <p className="difficulty">Difficulty: {q.difficulty}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No questions available for this quiz.</p>
      )}

      <button
        className="back-button"
        onClick={() => navigate(-1)}
      >
        Back
      </button>
    </div>
  );
}
