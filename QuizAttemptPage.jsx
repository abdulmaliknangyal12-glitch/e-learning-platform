// frontend/src/pages/Student/QuizAttmeptPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function QuizAttmeptPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  // TODO: replace with real auth user id
// const studentId = 5003; // ❌ remove this
const studentId = Number(localStorage.getItem("studentId")); // ✅ use logged-in student ID


  const [quizMeta, setQuizMeta] = useState(null); // { QID, QuizTitle, TotalMarks, TQUES }
  const [questions, setQuestions] = useState([]); // normalized shape (see normalizeQuestions)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersByQsNo, setAnswersByQsNo] = useState({}); // { [QsNO]: "selected option text" }
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null); // { score, totalQuestions, ... }

  // per-question timer
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef(null);
  const API_BASE =
    import.meta?.env?.VITE_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:5000";

  // --- helpers ---------------------------------------------------------------
  const normalizeQuestions = (rows = []) =>
    rows
      .map((q, idx) => {
        // Accept either aliased or raw DB column names
        const qsNo = q.QsNO ?? q.QsNo ?? q.qsno ?? q.qno ?? idx + 1; // per-quiz question number
        const text =
          q.QuestionText ??
          q.Question_Text ??
          q.question ??
          q.Question ??
          q.QuestionTextAlt ??
          `Question ${qsNo}`;
        const option1 = q.Option1 ?? q.Op1 ?? q.op1 ?? q.OptionA ?? q.OpA ?? "";
        const option2 = q.Option2 ?? q.Op2 ?? q.op2 ?? q.OptionB ?? q.OpB ?? "";
        const option3 = q.Option3 ?? q.Op3 ?? q.op3 ?? q.OptionC ?? q.OpC ?? "";
        const option4 = q.Option4 ?? q.Op4 ?? q.op4 ?? q.OptionD ?? q.OpD ?? "";

        return {
          qsNo,
          text,
          options: [option1, option2, option3, option4].filter(
            (o) => o !== "" && o != null
          ),
        };
      })
      .filter((q) => q.text && q.options.length > 0);

  const currentQuestion = useMemo(
    () => (questions.length ? questions[currentIndex] : null),
    [questions, currentIndex]
  );

  const progressPct = useMemo(() => {
    if (!questions.length) return 0;
    return Math.round(((currentIndex + 1) / questions.length) * 100);
  }, [currentIndex, questions.length]);

  // --- fetch questions -------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function fetchQuiz() {
      setLoading(true);
      setFetchError("");
      try {
        const res = await axios.get(
          `${API_BASE}/api/student/quizzes/${quizId}/questions`,
          { withCredentials: true }
        );

        // Expecting { quiz, questions }
        const meta = res.data?.quiz ?? null;
        const qRows = res.data?.questions ?? [];

        if (!cancelled) {
          setQuizMeta(meta);
          const normalized = normalizeQuestions(qRows);
          setQuestions(normalized);
          setCurrentIndex(0);
          setAnswersByQsNo({});
          setTimeLeft(30);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch quiz:", err);
          setFetchError(
            err?.response?.data?.error ||
              "Server error fetching quiz questions"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchQuiz();
    return () => {
      cancelled = true;
    };
  }, [API_BASE, quizId]);

  // --- timer for each question ------------------------------------------------
  useEffect(() => {
    // reset time when question changes
    setTimeLeft(30);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // start interval only if there's a current question and quiz not submitted
    if (currentQuestion && !submitResult) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            // time's up
            clearInterval(timerRef.current);
            timerRef.current = null;
            handleTimeoutForCurrentQuestion();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentQuestion, submitResult]);

  // Called when time runs out for the current question
  const handleTimeoutForCurrentQuestion = () => {
    if (!currentQuestion) return;
    const qs = currentQuestion.qsNo;

    // If already answered (user clicked around the same time), don't overwrite
    setAnswersByQsNo((prev) => {
      if (prev && Object.prototype.hasOwnProperty.call(prev, qs)) {
        return prev;
      }
      const next = { ...prev, [qs]: null }; // null means unanswered/timeout
      return next;
    });

    // move to next or submit if last
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // last question timed out -> auto submit
      // small delay to let UI update
      setTimeout(() => {
        handleSubmit();
      }, 200);
    }
  };

  // --- actions ---------------------------------------------------------------
  const handleChooseOption = (optionText) => {
    if (!currentQuestion) return;
    const qs = currentQuestion.qsNo;

    // if already answered for this question, ignore duplicate clicks
    setAnswersByQsNo((prev) => {
      if (prev && Object.prototype.hasOwnProperty.call(prev, qs)) {
        return prev; // don't overwrite
      }
      return { ...prev, [qs]: optionText };
    });

    // clear timer for this question
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // If not last, go to next
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      // If final question answered, auto-submit
      setTimeout(() => {
        handleSubmit();
      }, 150);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  };

  const handleSubmit = async () => {
    // Build payload expected by backend: answers = [{ QsNO, Answer }, ...]
    // Ensure we include entries for unanswered (timeout) questions as null
    const allQsNos = questions.map((q) => q.qsNo);
    const formattedAnswers = allQsNos.map((qsNo) => ({
      QsNO: Number(qsNo),
      Answer:
        answersByQsNo && Object.prototype.hasOwnProperty.call(answersByQsNo, qsNo)
          ? answersByQsNo[qsNo]
          : null,
    }));

    if (!formattedAnswers.length) {
      alert("Please answer at least one question.");
      return;
    }

    // Prevent double submit
    if (submitting) return;
    setSubmitting(true);
    setSubmitResult(null);

    try {
      const res = await axios.post(
        `${API_BASE}/api/student/quizzes/${quizId}/submit`,
        {
          studentId,
          answers: formattedAnswers,
        },
        { withCredentials: true }
      );

      // show result returned by backend
      setSubmitResult(res.data);
    } catch (err) {
      console.error("Error submitting quiz:", err);
      alert(
        err?.response?.data?.error || "Something went wrong submitting the quiz."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswersByQsNo({});
    setSubmitResult(null);
    setTimeLeft(30);
  };

  // --- render ---------------------------------------------------------------
  if (loading) return <div style={{ padding: 16 }}>Loading quiz…</div>;

  if (fetchError)
    return (
      <div style={{ padding: 16, color: "crimson" }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Failed to load.</div>
        <div>{fetchError}</div>
      </div>
    );

  if (!questions.length)
    return (
      <div style={{ padding: 16 }}>
        <h2>No questions found for this quiz.</h2>
      </div>
    );

  const answeredCount = Object.keys(answersByQsNo).length;
  const isLastQuestion = currentIndex === questions.length - 1;
  const selectedForCurrent = answersByQsNo[currentQuestion?.qsNo];

  // Finished screen: show when submitted
  const allAnswered = answeredCount === questions.length;

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: 16,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => navigate(-1)}>&larr; Back</button>
      </div>

      <div style={{ marginBottom: 8 }}>
        <h1 style={{ margin: 0 }}>
          {quizMeta?.QuizTitle || "Quiz"}{" "}
          {quizMeta?.TQUES ? `• ${quizMeta.TQUES} Qs` : ""}
        </h1>
        {quizMeta?.TotalMarks != null && (
          <div style={{ opacity: 0.8 }}>Total Marks: {quizMeta.TotalMarks}</div>
        )}
      </div>

      {/* Progress bar */}
      <div
        style={{
          background: "#eee",
          height: 8,
          borderRadius: 999,
          overflow: "hidden",
          margin: "12px 0 8px",
        }}
      >
        <div
          style={{
            width: `${progressPct}%`,
            height: "100%",
            background: "#4f46e5",
            transition: "width 200ms",
          }}
        />
      </div>
      <div style={{ marginBottom: 12, opacity: 0.8 }}>
        Question {currentIndex + 1} / {questions.length}
        <span style={{ float: "right", fontWeight: 700 }}>
          ⏳ {timeLeft}s
        </span>
      </div>

      {/* If submitted, show result */}
      {submitResult ? (
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 16,
            marginTop: 12,
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 8 }}>🎉 Quiz Submitted</h2>
          <div style={{ marginBottom: 8 }}>
            Score: <b>{submitResult.score ?? submitResult.correctAnswers ?? submitResult.correctAnswers}</b>{" "}
            / {submitResult.totalQuestions ?? questions.length}
          </div>
          {submitResult.quizAttemptId && (
            <div style={{ marginBottom: 8 }}>
              Attempt ID: {submitResult.quizAttemptId}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => navigate(-1)}>Done</button>
            <button onClick={handleRestart}>Retake</button>
          </div>
        </div>
      ) : (
        // Question card
        currentQuestion && (
          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 16 }}>
              {currentQuestion.text}
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {currentQuestion.options.map((opt, i) => {
                const isSelected = selectedForCurrent === opt;
                return (
                  <button
                    key={i}
                    onClick={() => handleChooseOption(opt)}
                    style={{
                      textAlign: "left",
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: `2px solid ${isSelected ? "#4f46e5" : "#ddd"}`,
                      background: isSelected ? "#eef2ff" : "white",
                      cursor: "pointer",
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Controls (optional back/next) */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 16,
              }}
            >
              <button onClick={handlePrev} disabled={currentIndex === 0}>
                ← Previous
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                {!isLastQuestion ? (
                  <button
                    onClick={() =>
                      setCurrentIndex((i) =>
                        Math.min(questions.length - 1, i + 1)
                      )
                    }
                    disabled={!selectedForCurrent}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedForCurrent || submitting}
                  >
                    {submitting ? "Submitting…" : "Submit Quiz"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
