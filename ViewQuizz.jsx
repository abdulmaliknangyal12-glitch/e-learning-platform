// src/pages/.../ViewQuizz.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ViewQuizz.css";

export default function ViewQuizz() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getAuthConfig = () => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return { withCredentials: true, headers };
  };

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(
          `http://localhost:5000/api/teacher/quizzes/${quizId}/details`,
          getAuthConfig()
        );

        const payload = res.data ?? {};

        // Debug helper: uncomment if you want to inspect API payload
        // console.debug('Quiz details payload:', payload);

        if (payload.quiz && payload.questions) {
          setQuiz(normalizeQuiz(payload.quiz, payload.questions));
        } else if (payload.questions || payload.Questions) {
          const title = payload.title || payload.QuizTitle || `Quiz ${quizId}`;
          setQuiz(normalizeQuiz({ QuizTitle: title }, payload.questions || payload.Questions));
        } else {
          const qObj = payload.quiz ?? payload;
          const questionsRaw = payload.questions ?? payload.Questions ?? payload.questionsList ?? [];
          setQuiz(normalizeQuiz(qObj, questionsRaw));
        }
      } catch (err) {
        console.error("Error fetching quiz:", err);
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          navigate("/login");
          return;
        }
        setError(err?.response?.data?.message || "Failed to load quiz details.");
      } finally {
        setLoading(false);
      }
    };

    if (quizId) fetchQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  // Normalize quiz & questions into { title, questions: [ { question, options[4], correctAnswer, difficulty } ] }
  const normalizeQuiz = (quizObj = {}, questionsArr = []) => {
    const title =
      quizObj.QuizTitle ??
      quizObj.title ??
      quizObj.Title ??
      quizObj.quizTitle ??
      quizObj.name ??
      `Quiz ${quizId}`;

    const rawQs = Array.isArray(questionsArr) ? questionsArr : [];

    const questions = rawQs.map((q) => {
      // Accept many possible field names
      const questionText =
        (q.QuestionText ?? q.question ?? q.QText ?? q.text ?? q.Question ?? "").toString();

      // Force exactly 4 options (keep blanks if any)
      const options = [
        (q.Option1 ?? q.Op1 ?? q.option1 ?? q.OptionA ?? q.A ?? q.opt1 ?? "").toString(),
        (q.Option2 ?? q.Op2 ?? q.option2 ?? q.OptionB ?? q.B ?? q.opt2 ?? "").toString(),
        (q.Option3 ?? q.Op3 ?? q.option3 ?? q.OptionC ?? q.C ?? q.opt3 ?? "").toString(),
        (q.Option4 ?? q.Op4 ?? q.option4 ?? q.OptionD ?? q.D ?? q.opt4 ?? "").toString(),
      ];

      const correctAnswer =
        (q.CorrectAnswer ?? q.correctAnswer ?? q.Answer ?? q.Correct ?? "").toString();

      const difficulty =
        (q.DifficultyLevel ?? q.difficulty ?? q.Level ?? "Easy").toString();

      return {
        question: questionText,
        options,
        correctAnswer,
        difficulty,
      };
    });

    return { title, questions };
  };

  if (loading) return <div className="viewquiz-loading">Loading quiz...</div>;
  if (error) return <div className="viewquiz-error">{error}</div>;
  if (!quiz) return <div className="viewquiz-empty">Quiz not found.</div>;

  return (
    <div className="viewquiz-root">
      <div className="viewquiz-card">
        <h1 className="viewquiz-title">{quiz.title}</h1>

        {quiz.questions && quiz.questions.length > 0 ? (
          <div className="viewquiz-questions">
            {quiz.questions.map((q, i) => (
              <div className="question-card" key={i}>
                <div className="question-head">
                  <strong>Q{i + 1}:</strong>
                  <span className="question-text">{q.question || <em>(No question text)</em>}</span>
                </div>

                <ul className="options-list">
                  {q.options.map((opt, idx) => {
                    // Compare values trimmed & case-insensitive so stored text vs option text matches.
                    const isCorrect =
                      String(opt).trim().toLowerCase() ===
                      String(q.correctAnswer).trim().toLowerCase();

                    return (
                      <li
                        key={idx}
                        className={`option-item ${isCorrect ? "correct" : ""}`}
                      >
                        <span className="opt-label">{String.fromCharCode(65 + idx)}.</span>
                        <span className="opt-text">{opt || <em>(empty)</em>}</span>
                        {isCorrect && <span className="correct-badge">✔ Correct</span>}
                      </li>
                    );
                  })}
                </ul>

                <div className="question-meta">Difficulty: {q.difficulty}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-questions">No questions available for this quiz.</p>
        )}

        <div className="viewquiz-actions">
          <button className="btn-back" onClick={() => navigate(-1)}>← Back</button>
        </div>
      </div>
    </div>
  );
}
