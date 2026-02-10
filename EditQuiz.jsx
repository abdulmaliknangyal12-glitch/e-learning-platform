// src/pages/Teacher/EditQuiz.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function EditQuiz() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quizTitle, setQuizTitle] = useState('');
  const [totalMarks, setTotalMarks] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/teacher/quizzes/${quizId}/details`);
        const { quiz, questions } = res.data;

        setQuizTitle(quiz.QuizTitle ?? quiz.Title ?? '');
        setTotalMarks(quiz.TotalMarks ?? quiz.Marks ?? quiz.TQUES ?? (questions?.length || 0));

        setQuestions((questions || []).map((q, i) => ({
          QuestionText: q.QuestionText || q.question || '',
          Option1: q.Option1 || q.Op1 || '',
          Option2: q.Option2 || q.Op2 || '',
          Option3: q.Option3 || q.Op3 || '',
          Option4: q.Option4 || q.Op4 || '',
          CorrectAnswer: q.CorrectAnswer || q.Answer || '',
          DifficultyLevel: q.DifficultyLevel || 'Easy',
          SequenceNo: q.SequenceNo ?? q.QsNo ?? (i + 1),
        })));
      } catch (err) {
        console.error('Load quiz for edit failed:', err);
        alert('Failed to load quiz for editing.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [quizId]);

  const handleQChange = (idx, field, value) => {
    setQuestions((qs) => {
      const copy = [...qs];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

const handleSave = async (e) => {
  e.preventDefault();

  if (!quizTitle.trim()) return alert('Enter quiz title');
  if (!questions.length) return alert('No questions found to update');

  setSaving(true);
  try {
    await axios.put(`http://localhost:5000/api/teacher/quizzes/${quizId}`, {
      QuizTitle: quizTitle,              // ✅ fixed case
      TQUES: questions.length,
      TotalMarks: totalMarks,
      // If you want to also update questions later, you'll need another endpoint
    });
    alert('Quiz updated successfully');
    navigate(`/teacher-dashboard/quiz/${quizId}/details`);
  } catch (err) {
    console.error('Save failed:', err.response?.data || err.message);
    alert('Failed to save quiz');
  } finally {
    setSaving(false);
  }
};

  if (loading) return <p>Loading editor...</p>;

  return (
    <div style={{ padding: 12 }}>
      <h2>Edit Quiz</h2>
      <form onSubmit={handleSave}>
        <div>
          <label>Quiz Title</label>
          <input
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Total Marks</label>
          <input
            type="number"
            value={totalMarks}
            onChange={(e) => setTotalMarks(parseInt(e.target.value || 0, 10))}
          />
        </div>

        <div>
          {questions.map((q, idx) => (
            <div
              key={idx}
              style={{ border: '1px solid #ddd', padding: 8, marginTop: 8 }}
            >
              <div>
                <label>Question {idx + 1}</label>
                <textarea
                  value={q.QuestionText}
                  onChange={(e) =>
                    handleQChange(idx, 'QuestionText', e.target.value)
                  }
                  required
                />
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                }}
              >
                <input
                  placeholder="Option 1"
                  value={q.Option1}
                  onChange={(e) =>
                    handleQChange(idx, 'Option1', e.target.value)
                  }
                  required
                />
                <input
                  placeholder="Option 2"
                  value={q.Option2}
                  onChange={(e) =>
                    handleQChange(idx, 'Option2', e.target.value)
                  }
                  required
                />
                <input
                  placeholder="Option 3"
                  value={q.Option3}
                  onChange={(e) =>
                    handleQChange(idx, 'Option3', e.target.value)
                  }
                  required
                />
                <input
                  placeholder="Option 4"
                  value={q.Option4}
                  onChange={(e) =>
                    handleQChange(idx, 'Option4', e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <label>Correct Answer</label>
                <input
                  value={q.CorrectAnswer}
                  onChange={(e) =>
                    handleQChange(idx, 'CorrectAnswer', e.target.value)
                  }
                  required
                />
              </div>
              <div>
                <label>Difficulty</label>
                <select
                  value={q.DifficultyLevel}
                  onChange={(e) =>
                    handleQChange(idx, 'DifficultyLevel', e.target.value)
                  }
                >
                  <option>Easy</option>
                  <option>Moderate</option>
                  <option>Hard</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Quiz'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{ marginLeft: 8 }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
