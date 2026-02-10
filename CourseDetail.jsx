// src/pages/CourseDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FiArrowLeft, FiEye, FiEdit, FiTrash2 } from "react-icons/fi";
import "./CourseDetail.css";

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState("lectures");

  const parsedCourseId = Number(courseId);

  // helpers (unchanged)
  const getLessonId = (lec) =>
    lec.LSID ?? lec.LessonID ?? lec.LID ?? lec.id ?? lec.LessonId;
  const lectureTitle = (lec) =>
    lec.LectureTitle ?? lec.Content ?? lec.Title ?? lec.name ?? `Lecture-${lec.LectureNumber ?? "?"}`;
  const lectureType = (lec) => lec.Type ?? lec.type ?? "PDF";
  const lectureLink = (lec) =>
    lec.Link ?? lec.FilePath ?? lec.filePath ?? lec.link ?? "";

  const openLectureFile = (link) => {
    if (!link) return;
    const url = link.startsWith("/") ? `http://localhost:5000${link}` : link;
    window.open(url, "_blank");
  };

  const getWeekNum = (label) => {
    if (typeof label === "number") return label;
    const m = String(label).match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  };

  const handleDeleteLecture = async (lessonId) => {
    if (!window.confirm("Are you sure you want to delete this lecture?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/teacher/lectures/${lessonId}`);
      setLectures((prev) =>
        prev
          .map((w) => ({
            ...w,
            lectures: (w.lectures || []).filter(
              (lec) => String(getLessonId(lec)) !== String(lessonId)
            ),
          }))
          .filter((w) => (w.lectures || []).length > 0)
      );
    } catch (err) {
      console.error("Failed to delete lecture:", err);
      alert("Failed to delete lecture");
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      if (!courseId || isNaN(parsedCourseId)) {
        console.error("❌ Invalid courseId in URL:", courseId);
        return;
      }

      try {
        const res = await axios.get(`http://localhost:5000/api/course/${parsedCourseId}/details`);
        setCourse(res.data.course);
        setQuizzes(res.data.quizzes || []);
        setAssignments(res.data.assignments || []);

        const lectureRes = await axios.get(
          `http://localhost:5000/api/teacher/lectures/groupedByWeek?courseId=${parsedCourseId}`
        );
        setLectures(Array.isArray(lectureRes.data) ? lectureRes.data : []);

        const studentsRes = await axios.get(
          `http://localhost:5000/api/teacher/enrolled/${parsedCourseId}`
        );
        setStudents(studentsRes.data || []);
      } catch (err) {
        console.error("❌ Failed to fetch course details", err);
      }
    };
    fetchDetails();
  }, [courseId, parsedCourseId]);

  if (!course) return <div className="p-4">Loading course details...</div>;

  // inline style objects unchanged...
  const weekSectionStyle = { marginBottom: "2.5rem" };
  const weekTitleStyle = { textAlign: "center", fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" };
  const cardsRowOuter = { display: "flex", justifyContent: "center" };
  const cardsRowInner = { display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" };
  const cardStyle = { width: 340, maxWidth: "92%", background: "#ffffff", padding: "1rem", borderRadius: 12, boxShadow: "0 6px 18px rgba(0,0,0,0.06)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" };
  const cardTitleStyle = { fontSize: "1rem", fontWeight: 600, marginBottom: 6 };
  const smallTextStyle = { color: "#6b7280", marginBottom: 10 };
  const btnRowStyle = { display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" };
  const btnPrimary = { padding: "0.45rem 0.85rem", borderRadius: 8, border: "none", cursor: "pointer" };

  // styles for new quiz cards
  const quizGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, alignItems: "stretch" };
  const quizCardStyle = { background: "#fff", borderRadius: 10, padding: 14, boxShadow: "0 6px 20px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 140, border: "1px solid #eef2f7" };
  const quizTitleStyle = { fontSize: 16, fontWeight: 700, marginBottom: 8 };
  const quizMetaStyle = { fontSize: 13, color: "#374151", marginBottom: 10 };
  const actionsRow = { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 };
  const actionBtn = { display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "none", cursor: "pointer" };

  // helper to format date safely
  const fmtDate = (d) => {
    if (!d) return "-";
    try {
      const t = new Date(d);
      return isNaN(t.getTime()) ? d : t.toLocaleDateString();
    } catch {
      return d;
    }
  };

  // delete quiz helper (used by quiz cards)
  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm("Delete this quiz? This action is permanent.")) return;
    try {
      await axios.delete(`http://localhost:5000/api/teacher/quizzes/${quizId}`);
      setQuizzes((prev) => prev.filter((q) => String(q.QID ?? q.id) !== String(quizId)));
    } catch (err) {
      console.error("Failed to delete quiz:", err);
      alert("Failed to delete quiz");
    }
  };

  return (
    <div className="course-detail">
      {/* Back Button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: 16,
          cursor: "pointer",
          color: "#2563eb",
          fontWeight: 600,
        }}
        onClick={() => navigate(-1)}
      >
        <FiArrowLeft style={{ marginRight: 8 }} />
        Back
      </div>

      <h1 style={{ textAlign: "left" }}>{course.CourseName}</h1>

      {/* NEW: Add Lecture Plan button (first step) */}
      <div className="upload-buttons" style={{ margin: "12px 0" }}>
        <button
          onClick={() => navigate(`/teacher-dashboard/${parsedCourseId}/add-lecture-plan`)}
          className="upload-lecture"
          style={{ padding: "0.5rem 1rem", borderRadius: 8 }}
        >
          Add Lecture Plan
        </button>

        {/* If you want a direct Upload button only when plans exist, show it */}
        <button
          onClick={() => navigate(`/teacher-dashboard/${parsedCourseId}/add-lecture`)}
          className="upload-lecture"
          style={{ padding: "0.5rem 1rem", borderRadius: 8, marginLeft: 8 }}
        >
          Upload Lecture
        </button>
      </div>

      {/* Tabs (unchanged) */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        {["lectures", "quizzes", "assignments", "students"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? "active" : ""}
            style={{
              marginRight: 8,
              padding: "0.45rem 0.9rem",
              borderRadius: 6,
              background: activeTab === tab ? "#111827" : "#f3f4f6",
              color: activeTab === tab ? "#fff" : "#111827",
              border: "none",
              cursor: "pointer",
            }}
          >
            {tab === "students" ? "Enrolled Students" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === "lectures" && (
          <div>
            {lectures.length === 0 ? (
              <p style={{ textAlign: "center" }}>No lectures uploaded yet.</p>
            ) : (
              lectures.map(({ week, lectures: weekLectures }) => {
                const arr = Array.isArray(weekLectures) ? weekLectures : [weekLectures];
                return (
                  <section key={week} className="week-section" style={weekSectionStyle}>
                    <h3 style={weekTitleStyle}>{week}</h3>
                    <div style={cardsRowOuter}>
                      <div style={cardsRowInner}>
                        {arr.map((lecture, idx) => {
                          const lessonId = getLessonId(lecture) ?? idx;
                          return (
                            <div key={lessonId} className="lecture-card" style={cardStyle}>
                              <h4 style={cardTitleStyle}>Lecture-{lecture.LectureNumber ?? idx + 1}</h4>
                              <div style={{ marginBottom: 8, fontWeight: 500 }}>
                                <span style={{ fontWeight: 600 }}>{lectureTitle(lecture)}</span>
                              </div>
                              <p style={smallTextStyle}>Type: {lectureType(lecture)}</p>

                              <div style={btnRowStyle}>
                                <button
                                  className="btn-pdf"
                                  onClick={() => openLectureFile(lectureLink(lecture))}
                                  style={{ ...btnPrimary, background: "#2563eb", color: "#fff" }}
                                >
                                  View {lectureType(lecture)}
                                </button>

                                <button
                                  className="btn-delete"
                                  onClick={() => handleDeleteLecture(lessonId)}
                                  style={{ ...btnPrimary, background: "#ef4444", color: "#fff" }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        <div style={cardStyle}>
                          {arr.length >= 2 ? (
                            <>
                              <button
                                className="btn-quiz"
                                style={{ ...btnPrimary, background: "#059669", color: "#fff", width: "100%", marginBottom: 8 }}
                                onClick={() => navigate(`/teacher-dashboard/${parsedCourseId}/add-quiz?week=${getWeekNum(week)}`)}
                              >
                                Upload Quiz
                              </button>

                              <button
                                className="btn-assignment"
                                style={{ ...btnPrimary, background: "#7c3aed", color: "#fff", width: "100%" }}
                                onClick={() =>
                                  navigate(
                                    `/teacher-dashboard/${parsedCourseId}/lecture/${arr[0] ? getLessonId(arr[0]) : 1}/add-assignment?week=${getWeekNum(week)}`
                                  )
                                }
                              >
                                Upload Assignment
                              </button>
                            </>
                          ) : (
                            <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center" }}>
                              Upload Quiz & Assignment appear after 2 lectures are added.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                );
              })
            )}
          </div>
        )}

        {activeTab === "quizzes" && (
          <div>
            {quizzes.length === 0 ? (
              <p style={{ textAlign: "center" }}>No quizzes uploaded yet.</p>
            ) : (
              <div style={quizGridStyle}>
                {quizzes.map((quiz) => {
                  const qid = quiz.QID ?? quiz.id ?? quiz.Qid;
                  const title = quiz.QuizTitle ?? quiz.Title ?? quiz.Name ?? "Untitled Quiz";
                  const questions = quiz.TQUES ?? quiz.TotalQuestions ?? quiz.QuestionCount ?? quiz.questions ?? "-";
                  const marks = quiz.TotalMarks ?? quiz.Marks ?? quiz.totalMarks ?? "-";
                  const createdAt = quiz.CreatedAt ?? quiz.created_at ?? quiz.DateCreated ?? "";

                  return (
                    <div key={qid ?? title} style={quizCardStyle}>
                      <div>
                        <div style={quizTitleStyle}>{title}</div>
                        <div style={quizMetaStyle}>
                          <div><strong>Questions:</strong> {questions}</div>
                          <div><strong>Marks:</strong> {marks}</div>
                          <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
                         
                          </div>
                        </div>
                      </div>

                      <div style={actionsRow}>
                        <button
                          onClick={() => navigate(`/teacher-dashboard/quiz/${qid}/details`)}
                          style={{ ...actionBtn, background: "#eef2ff", color: "#2563eb" }}
                          title="View quiz details"
                        >
                          <FiEye /> View
                        </button>

                        <button
                          onClick={() => navigate(`/teacher-dashboard/quiz/${qid}/edit`)}
                          style={{ ...actionBtn, background: "#ecfdf5", color: "#059669" }}
                          title="Edit quiz"
                        >
                          <FiEdit /> Edit
                        </button>

                        <button
                          onClick={() => handleDeleteQuiz(qid)}
                          style={{ ...actionBtn, background: "#fff1f2", color: "#c0262e" }}
                          title="Delete quiz"
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "assignments" && (
          <div>
            {assignments.length === 0 ? (
              <p>No assignments uploaded yet.</p>
            ) : (
              assignments.map((assignment) => (
                <div key={assignment.ASID ?? assignment.Asid ?? assignment.AID} className="assignment-card" style={{ marginBottom: 12 }}>
                  <h2>{assignment.AssignmentTitle ?? "Assignment"}</h2>
                  <p>Lecture: {assignment.LectureTitle ?? "-"}</p>
                  <a href={assignment.FilePath ? `http://localhost:5000${assignment.FilePath}` : "#"} target="_blank" rel="noreferrer">
                    View Assignment
                  </a>
                  <div style={{ marginTop: 8 }}>
                    <button
                      onClick={async () => {
                        if (!window.confirm("Delete this assignment?")) return;
                        try {
                          const id = assignment.ASID ?? assignment.Asid ?? assignment.AID;
                          await axios.delete(`http://localhost:5000/api/teacher/assignments/${id}`);
                          setAssignments((prev) => prev.filter((a) => (a.ASID ?? a.Asid ?? a.AID) !== id));
                        } catch (err) {
                          console.error(err);
                          alert("Failed to delete assignment");
                        }
                      }}
                      className="btn-delete"
                      style={{ ...btnPrimary, background: "#ef4444", color: "#fff" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "students" && (
          <div>
            {students.length === 0 ? (
              <p>No students enrolled in this course yet.</p>
            ) : (
              <div className="student-list">
                {students.map((student) => (
                  
                  <div key={student.SID ?? student.Uid} className="student-card">
                    <div className="student-header">
                      <div className="student-details">
                        <h2>{student.FName} {student.LName}</h2>
                      
                      <p><strong>Email:</strong> {student.Email}</p>
                      <p><strong>Phone:</strong> {student.PhoneNo}</p>
                      <p><strong>City:</strong> {student.City ?? "-"}</p>
                    </div>
                      <br />
                      <button className="btn-quiz" onClick={() => navigate(`/teacher-dashboard/course/${parsedCourseId}/student/${student.SID}/progress`)} style={{ ...btnPrimary, background: "#2563eb", color: "#fff" }}>
                        Progress
                      </button>
                    </div>
                    
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
