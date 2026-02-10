// src/pages/TeacherDashboard/AddQuiz.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AddQuiz.css';

export default function AddQuiz() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const makeEmptyQuestion = () => ({
    question: '',
    Op1: '',
    Op2: '',
    Op3: '',
    Op4: '',
    Answer: '',
    DifficultyLevel: 'Easy',
  });

  const [quizTitle, setQuizTitle] = useState('');
  const [weekNumber, setWeekNumber] = useState('');
  const [questions, setQuestions] = useState([makeEmptyQuestion()]);
  const [totalMarks, setTotalMarks] = useState(1);
  const [totalMarksTouched, setTotalMarksTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const questionRefs = useRef([]);

  useEffect(() => {
    if (!totalMarksTouched) {
      setTotalMarks(questions.length);
    }
  }, [questions.length, totalMarksTouched]);

  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    // include explicit Content-Type to avoid any transport ambiguity
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return { withCredentials: true, headers };
  };

  const handleQuestionChange = (idx, field, value) => {
    setQuestions((qs) => {
      const copy = [...qs];
      copy[idx] = { ...copy[idx], [field]: value };
      // keep correct answer in sync with option text
      if (['Op1', 'Op2', 'Op3', 'Op4'].includes(field)) {
        const ops = [copy[idx].Op1, copy[idx].Op2, copy[idx].Op3, copy[idx].Op4];
        if (!ops.includes(copy[idx].Answer)) copy[idx].Answer = '';
      }
      return copy;
    });
  };

  const addQuestion = () => {
    if (questions.length >= 10) {
      alert('❌ Maximum 10 questions allowed.');
      return;
    }
    setQuestions([...questions, makeEmptyQuestion()]);
  };

  const validateAll = () => {
    if (!quizTitle.trim()) { alert('Please enter a quiz title.'); return false; }
    if (!weekNumber) { alert('Please enter week number.'); return false; }
    if (questions.length === 0) { alert('Please add at least one question.'); return false; }

    const tm = parseInt(totalMarks, 10);
    if (isNaN(tm) || tm <= 0) { alert('Please enter a valid Total Marks (positive number).'); return false; }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) { alert(`Please enter Question ${i + 1}.`); return false; }
      if (![q.Op1, q.Op2, q.Op3, q.Op4].every((o) => o && o.trim())) {
        alert(`Fill all 4 options for Question ${i + 1}.`); return false;
      }
      if (![q.Op1, q.Op2, q.Op3, q.Op4].includes(q.Answer)) {
        alert(`Select correct answer for Question ${i + 1}.`); return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;

    setSubmitting(true);
    try {
      const tques = questions.length;
      const totalMarksInt = parseInt(totalMarks, 10);

      // Build create payload
      const createPayload = {
        quizTitle,
        TQUES: tques,
        TotalMarks: totalMarksInt,
        weekNumber: parseInt(weekNumber, 10),
        courseId: parseInt(courseId, 10), // backend will derive allocationId if needed
      };

      console.log('Creating quiz payload:', createPayload);

      // 1) create quiz record
      const createResp = await axios.post(
        'http://localhost:5000/api/teacher/quizzes/upload',
        createPayload,
        getAuthConfig()
      );

      const quizId = createResp?.data?.quizId;
      if (!quizId) throw new Error('Could not determine created quiz ID.');

      // 2) prepare questions payload in expected shape
      const qPayload = questions.map((q, i) => ({
        QuestionText: q.question,
        Option1: q.Op1,
        Option2: q.Op2,
        Option3: q.Op3,
        Option4: q.Op4,
        CorrectAnswer: q.Answer,
        DifficultyLevel: q.DifficultyLevel,
        SequenceNo: i + 1,
      }));

      console.log('Uploading questions payload (first item):', qPayload[0]);

      // 3) upload questions
      await axios.post(
        'http://localhost:5000/api/teacher/quizzes/upload-questions',
        { quizId: parseInt(quizId, 10), questions: qPayload },
        getAuthConfig()
      );

      alert('✅ Quiz and questions uploaded successfully!');
      navigate(`/teacher-dashboard/${courseId}/details`);
    } catch (err) {
      console.error('Upload quiz error:', err, err?.response?.data ?? '');
      alert(`Upload failed: ${err?.response?.data?.error ?? err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-quiz-container">
      <h2>Add New Quiz</h2>
      <form onSubmit={handleSubmit} className="add-quiz-form">
        <div className="form-row">
          <div className="form-group">
            <label>Quiz Title:</label>
            <input className="input" type="text" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Week Number:</label>
            <input className="input" type="number" value={weekNumber} onChange={(e) => setWeekNumber(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Total Marks:</label>
            <input className="input" type="number" value={totalMarks} onChange={(e) => { setTotalMarksTouched(true); setTotalMarks(e.target.value); }} min="1" required />
          </div>
        </div>

        <h3>Questions ({questions.length})</h3>
        {questions.map((q, idx) => (
          <div className="question-item" key={idx} ref={(el) => (questionRefs.current[idx] = el)}>
            <div className="form-group">
              <label>Question {idx + 1}:</label>
              <textarea className="input textarea" value={q.question} onChange={(e) => handleQuestionChange(idx, 'question', e.target.value)} required />
            </div>

            <div className="options-grid">
              <div className="form-group">
                <label>Option 1:</label>
                <input className="input" value={q.Op1} onChange={(e) => handleQuestionChange(idx, 'Op1', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Option 2:</label>
                <input className="input" value={q.Op2} onChange={(e) => handleQuestionChange(idx, 'Op2', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Option 3:</label>
                <input className="input" value={q.Op3} onChange={(e) => handleQuestionChange(idx, 'Op3', e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Option 4:</label>
                <input className="input" value={q.Op4} onChange={(e) => handleQuestionChange(idx, 'Op4', e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label>Correct Answer:</label>
              <select className="select" value={q.Answer} onChange={(e) => handleQuestionChange(idx, 'Answer', e.target.value)} required>
                <option value="">-- Select correct option --</option>
                <option value={q.Op1}>{q.Op1 || 'Option 1'}</option>
                <option value={q.Op2}>{q.Op2 || 'Option 2'}</option>
                <option value={q.Op3}>{q.Op3 || 'Option 3'}</option>
                <option value={q.Op4}>{q.Op4 || 'Option 4'}</option>
              </select>
            </div>

            <div className="form-group">
              <label>Difficulty:</label>
              <select className="select" value={q.DifficultyLevel} onChange={(e) => handleQuestionChange(idx, 'DifficultyLevel', e.target.value)}>
                <option>Easy</option>
                <option>Moderate</option>
                <option>Hard</option>
              </select>
            </div>
          </div>
        ))}

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={addQuestion}>➕ Add Question</button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Uploading...' : `Upload Quiz (${questions.length} Qs, ${totalMarks} Marks)`}
          </button>
        </div>
      </form>
    </div>
  );
}
