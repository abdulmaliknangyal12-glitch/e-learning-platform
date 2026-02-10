import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AddQuestions.css';

const AddQuestions = () => {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();

  const [lecturePlans, setLecturePlans] = useState([]);
  const [selectedLectureId, setSelectedLectureId] = useState('');

  const [questions, setQuestions] = useState(
    Array.from({ length: 10 }, () => ({
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: '',
      difficulty: 'Easy',
    }))
  );

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/teacher/lecturePlans/${courseId}`)
      .then((res) => setLecturePlans(res.data))
      .catch((err) => console.error('Error fetching lecture plans:', err));
  }, [courseId]);

  const handleChange = (index, field, value) => {
    const updated = [...questions];
    updated[index][field] = value;
    setQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLectureId) {
      alert('Please select a lecture.');
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/teacher/quizzes/upload-questions', {
        quizId,
        lectureId: selectedLectureId,
        questions,
      });
      alert('✅ Questions uploaded successfully');
      navigate(`/teacher-dashboard/${courseId}/details`);
    } catch (err) {
      console.error('❌ Upload error:', err);
      alert('Failed to upload questions.');
    }
  };

  return (
    <div className="add-questions-container">
      <h2>Add Questions for Quiz {quizId}</h2>

      <form onSubmit={handleSubmit}>
        {/* ✅ Lecture dropdown */}
        <label>
          Select Lecture:
          <select
            value={selectedLectureId}
            onChange={(e) => setSelectedLectureId(e.target.value)}
            required
          >
            <option value="">-- Select Lecture --</option>
            {lecturePlans.map((lec) => (
              <option key={lec.LID} value={lec.LID}>
                {lec.Week ? `Week ${lec.Week} - ` : ''}
                {lec.Content}
              </option>
            ))}
          </select>
        </label>

        {/* ✅ 10 Questions */}
        {questions.map((q, i) => (
          <div key={i} className="question-box">
            <h4>Question {i + 1}</h4>
            <input
              type="text"
              placeholder="Question Text"
              value={q.questionText}
              onChange={(e) => handleChange(i, 'questionText', e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Option A"
              value={q.optionA}
              onChange={(e) => handleChange(i, 'optionA', e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Option B"
              value={q.optionB}
              onChange={(e) => handleChange(i, 'optionB', e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Option C"
              value={q.optionC}
              onChange={(e) => handleChange(i, 'optionC', e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Option D"
              value={q.optionD}
              onChange={(e) => handleChange(i, 'optionD', e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Correct Answer (A/B/C/D)"
              value={q.correctAnswer}
              onChange={(e) => handleChange(i, 'correctAnswer', e.target.value)}
              required
            />
            <select
              value={q.difficulty}
              onChange={(e) => handleChange(i, 'difficulty', e.target.value)}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        ))}

        <button type="submit">Submit Questions</button>
      </form>
    </div>
  );
};

export default AddQuestions;
