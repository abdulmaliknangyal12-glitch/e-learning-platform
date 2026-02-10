// frontend/src/pages/StudentDashboard/StudentCourseDetail.jsx
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

export default function StudentCourseDetail() {
  const navigate = useNavigate();
  const params = useParams();

  const courseId = params.courseId || params.enrollId || params.id;
  const storedStudentId =
    localStorage.getItem("studentId") || localStorage.getItem("StudentID");
  const studentId = storedStudentId ? parseInt(storedStudentId, 10) : NaN;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [openWeeks, setOpenWeeks] = useState({});
  const [uploadingAssignmentId, setUploadingAssignmentId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Certificate states
  const [certificateStatus, setCertificateStatus] = useState("NotRequested");
  const [enrollId, setEnrollId] = useState(null);

  // Course Freeze states
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [freezeStartWeek, setFreezeStartWeek] = useState(1);
  const [freezeEndWeek, setFreezeEndWeek] = useState(1);
  const [freezeSubmitting, setFreezeSubmitting] = useState(false);
  const [freezes, setFreezes] = useState([]); // list of freeze requests

  const API_BASE =
    import.meta?.env?.VITE_API_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:5000";

  // ---------------------- Helpers for assignments (unchanged) -----------------------
  const resolveAssignmentId = (assignment) => {
    if (!assignment) return null;
    if (Array.isArray(assignment)) {
      for (const a of assignment) {
        const id = resolveAssignmentId(a);
        if (id) return id;
      }
      return null;
    }
    const keys = [
      "aid","Asid","asid","AssignmentID","assignmentId","AssignmentId","id","AID","AsId",
    ];
    for (const k of keys) {
      if (assignment[k] != null && !Number.isNaN(Number(assignment[k]))) {
        return Number(assignment[k]);
      }
    }
    if (assignment.Assignment && typeof assignment.Assignment === "object") {
      return resolveAssignmentId(assignment.Assignment);
    }
    if (assignment.data && typeof assignment.data === "object") {
      return resolveAssignmentId(assignment.data);
    }
    return null;
  };

  const getAssignmentFileUrl = (assignment) => {
    if (!assignment) return "#";
    return (
      assignment.file ?? assignment.FilePath ?? assignment.File ??
      assignment.filePath ?? assignment.url ?? assignment.fileUrl ?? "#"
    );
  };

  const isAssignmentAlreadySubmitted = (assignment) =>
    !!(
      assignment?.submitted ||
      assignment?.isSubmitted ||
      assignment?.Submitted ||
      assignment?.alreadySubmitted ||
      assignment?.submissionRecorded ||
      assignment?.SubmittedAt ||
      assignment?.studentSubmission ||
      assignment?.StdFile ||
      assignment?.StdFilePath
    );

  // ---------------------- Load course weeks & enrollment data -----------------------
  const reloadWeeksStructure = useCallback(async () => {
    if (!courseId || !studentId || Number.isNaN(studentId)) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE}/api/student/courses/${courseId}/weeks-structure`,
        { params: { studentId } }
      );
      setData(res.data || null);

      if (res.data?.enrollment) {
        setCertificateStatus(res.data.enrollment.CertificateStatus ?? "NotRequested");
        setEnrollId(res.data.enrollment.EnrollID ?? null);
      }

      const firstUnlocked =
        res.data?.weeks?.find((w) => !!w.isUnlocked)?.weekNo ??
        res.data?.weeks?.[0]?.weekNo ??
        1;
      if (firstUnlocked) setOpenWeeks({ [firstUnlocked]: true });
    } catch (err) {
      console.error("Failed to load course weeks-structure:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, courseId, studentId]);

  // ---------------------- Load certificate status (fallback/explicit) -----------------------
  const loadCertificateStatus = useCallback(async () => {
    if (!courseId || !studentId || Number.isNaN(studentId)) return;
    try {
      const res = await axios.get(`${API_BASE}/api/student/certificates/status`, {
        params: { studentId, courseId },
      });
      if (res?.data) {
        if (res.data.status) setCertificateStatus(res.data.status);
        if (res.data.enrollId) setEnrollId(res.data.enrollId);
      }
    } catch (err) {
      console.warn("Could not load certificate status:", err?.message || err);
    }
  }, [API_BASE, courseId, studentId]);

  // ---------------------- Load freezes -----------------------
  const loadFreezes = useCallback(async () => {
    if (!courseId || !studentId || Number.isNaN(studentId)) return;
    try {
      const res = await axios.get(`${API_BASE}/api/student/course-freeze`, {
        params: { studentId, courseId },
      });
      setFreezes(res.data?.freezes ?? []);
    } catch (err) {
      console.warn("Could not load freezes:", err?.message || err);
      setFreezes([]);
    }
  }, [API_BASE, courseId, studentId]);

  useEffect(() => {
    reloadWeeksStructure();
    loadCertificateStatus();
    loadFreezes();
  }, [reloadWeeksStructure, loadCertificateStatus, loadFreezes]);

  const toggleWeek = (weekNo, isUnlocked) => {
    if (!isUnlocked && weekNo !== 1) return;
    setOpenWeeks((prev) => ({ ...prev, [weekNo]: !prev[weekNo] }));
  };

  // ---------------------- Assignment submit flow -----------------------
  const openFilePickerForAssignment = (assignment) => {
    const aid = resolveAssignmentId(assignment);
    if (!aid) {
      alert("Assignment id not found. Check browser console for assignment object.");
      console.log("assignment object:", assignment);
      return;
    }
    if (!fileInputRef.current) return;
    fileInputRef.current.dataset.assignmentId = String(aid);
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  const onFileSelected = async (e) => {
    const file = e.target.files?.[0];
    const assignmentId = e.target.dataset?.assignmentId;
    if (!assignmentId || !file) return;
    await uploadAssignmentFile({ assignmentId: Number(assignmentId), file });
  };

  const uploadAssignmentFile = async ({ assignmentId, file }) => {
    const uploadUrl = `${API_BASE}/api/student/assignments/${assignmentId}/submit`;
    setUploadingAssignmentId(assignmentId);
    setUploadProgress(0);

    try {
      const form = new FormData();
      form.append("studentId", studentId);
      form.append("courseId", parseInt(courseId, 10));
      form.append("file", file);

      const res = await axios.post(uploadUrl, form, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
        onUploadProgress: (p) => {
          if (p.total) setUploadProgress(Math.round((p.loaded / p.total) * 100));
        },
      });

      if (res.status === 200 || res.status === 201) {
        alert(res.data?.message || "Assignment uploaded successfully.");
      } else {
        alert(res.data?.error || "Failed to upload assignment.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      const backendMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Upload failed.";
      alert(backendMsg);
    } finally {
      setUploadingAssignmentId(null);
      setUploadProgress(0);
      await reloadWeeksStructure();
      await loadFreezes();
    }
  };

  // ---------------------- Course Completion (unchanged) -----------------------
  const isCourseCompleted = useMemo(() => {
    if (!data) return false;
    const enrollment = data.enrollment ?? data.enroll ?? data.Enroll ?? null;
    if (enrollment) {
      const cs = (enrollment.CompletionStatus || enrollment.Status || "").toString().toLowerCase();
      if (cs === "completed" || cs === "complete" || enrollment.IsCompleted === true || enrollment.CourseCompleted === 1) return true;
    }
    const sp = data.studentProgress ?? data.progress ?? data.StudentProgress ?? {};
    const totalLectures = Number(data.totalLectures ?? data.total_lectures ?? data.TotalLectures ?? 0);
    const lecturesCompleted = Number(sp.LecturesCompleted ?? sp.CompletedLectures ?? sp.LastUnlockedLectureNo ?? 0);
    const totalQuizzes = Number(data.totalQuizzes ?? data.TotalQuizzes ?? 0);
    const quizzesPassed = Number(sp.QuizzesPassed ?? sp.PassedQuizzes ?? sp.Passed ?? 0);
    if (totalLectures > 0 && totalQuizzes > 0) return lecturesCompleted >= totalLectures && quizzesPassed >= totalQuizzes;
    if (totalLectures > 0) return lecturesCompleted >= totalLectures;
    if (totalQuizzes > 0) return quizzesPassed >= totalQuizzes;
    if (sp.LastPassedQuizID || sp.LastPassedQuizId) return true;
    if (Number(sp.LastUnlockedLectureNo ?? 0) > 0 && totalLectures > 0) return Number(sp.LastUnlockedLectureNo) >= totalLectures;
    return false;
  }, [data]);

  // ---------------------- Certificate actions (unchanged) -----------------------
  const requestCertificate = async () => {
    if (!studentId || Number.isNaN(studentId)) return alert("Student not found.");
    if (!isCourseCompleted) return alert("You can request a certificate only after completing the course.");
    try {
      const res = await axios.post(`${API_BASE}/api/student/certificates/request`, { studentId, courseId });
      if (res.status === 200 || res.status === 201) {
        setCertificateStatus("Pending");
        if (res.data?.enrollId) setEnrollId(res.data.enrollId);
        alert(res.data?.message || "Certificate request submitted.");
      } else {
        alert(res.data?.error || "Failed to request certificate.");
      }
    } catch (err) {
      console.error("Certificate request failed:", err);
      const msg = err?.response?.data?.error || err?.message || "Request failed.";
      alert(msg);
    }
  };

  const downloadCertificate = async () => {
    try {
      let url;
      if (enrollId) {
        url = `${API_BASE}/api/student/certificates/${enrollId}/download`;
      } else {
        url = `${API_BASE}/api/student/certificates/download`;
      }
      const config =
        enrollId
          ? { responseType: "blob" }
          : { params: { studentId, courseId }, responseType: "blob" };
      const response = await axios.get(url, config);
      if (!response || !response.data) return alert("Certificate not available for download.");
      const blob = new Blob([response.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `certificate_${courseId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Error downloading certificate:", err);
      const msg = err?.response?.data?.error || err?.message || "Download failed.";
      alert(msg);
    }
  };

  // ---------------------- Request Course Freeze -----------------------
  const submitCourseFreeze = async () => {
    if (!studentId || Number.isNaN(studentId)) return alert("Student not found.");
    if (!freezeStartWeek || !freezeEndWeek || freezeStartWeek > freezeEndWeek) return alert("Invalid week range.");

    try {
      setFreezeSubmitting(true);
      const res = await axios.post(`${API_BASE}/api/student/course-freeze`, {
        studentId,
        courseId: parseInt(courseId),
        startWeek: freezeStartWeek,
        endWeek: freezeEndWeek
      });

      if (res.status === 200 || res.status === 201) {
        alert(res.data?.message || "Course freeze request submitted.");
        setFreezeModalOpen(false);
        await loadFreezes();
      } else {
        alert(res.data?.error || "Failed to submit freeze request.");
      }
    } catch (err) {
      console.error("Freeze request failed:", err);
      const msg = err?.response?.data?.error || err?.message || "Request failed.";
      alert(msg);
    } finally {
      setFreezeSubmitting(false);
    }
  };

  // ---------------------- Resume Course -----------------------
  const resumeCourse = async (freezeId) => {
    if (!freezeId || !studentId || !courseId) return alert("Missing info for resume.");

    try {
      // disable if already submitting
      setFreezeSubmitting(true);
      const res = await axios.put(`${API_BASE}/api/student/course-freeze/${freezeId}/resume`, {
        studentId,
        courseId: parseInt(courseId)
      });

      if (res.status === 200) {
        alert(res.data?.message || "Course resumed successfully.");
        // refresh everything
        await reloadWeeksStructure();
        await loadFreezes();
      } else {
        alert(res.data?.error || "Failed to resume course.");
      }
    } catch (err) {
      console.error("Resume failed:", err);
      const msg = err?.response?.data?.error || err?.message || "Resume request failed.";
      alert(msg);
    } finally {
      setFreezeSubmitting(false);
    }
  };

  // ---------------------- UI helpers (unchanged) -----------------------
  const getPrimaryQABlock = (w) => {
    if (!w) return { quiz: null, assignments: [] };
    if (Array.isArray(w.qaBlocks) && w.qaBlocks.length) {
      const first = w.qaBlocks[0] ?? {};
      const assignmentsArr =
        (first.assignments && Array.isArray(first.assignments) && first.assignments) ||
        (first.assignment ? [first.assignment] : []) ||
        [];
      return {
        quiz: first.quiz ?? first.Quiz ?? null,
        assignments: assignmentsArr,
      };
    }
    const assignmentsArr =
      (w.assignments && Array.isArray(w.assignments) && w.assignments) ||
      (w.assignment ? [w.assignment] : []) ||
      [];
    return {
      quiz: w.quiz ?? w.Quiz ?? null,
      assignments: assignmentsArr,
    };
  };

  // ---------------------- Render -----------------------
  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (!data) return <div style={{ padding: 16 }}>No data or not enrolled.</div>;

  return (
    <div style={{ maxWidth: 1000, margin: "20px auto", padding: 16 }}>
      <h2 style={{ marginBottom: 4 }}>{data.courseName ?? "Course"}</h2>
      <div style={{ opacity: 0.85, marginBottom: 12 }}>
        Timeframe: <b>{data.timeframe ?? "N/A"}</b> &nbsp;|&nbsp; Total Lectures:{" "}
        <b>{data.totalLectures ?? 0}</b>
      </div>

      {/* hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        style={{ display: "none" }}
        onChange={onFileSelected}
      />

      {/* ---------- Request Course Freeze Button & Freeze list ---------- */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setFreezeModalOpen(true)}
          style={{ background: "#ef4444", color: "white", padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer" }}
        >
          Request Course Freeze
        </button>

        {/* Freeze history & resume controls */}
        <div style={{ marginTop: 12 }}>
          {freezes.length === 0 ? (
            <div style={{ color: "#6b7280" }}>No freeze requests yet.</div>
          ) : (
            <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
              {freezes.map((f) => (
                <div key={f.FreezeID ?? f.FreezeId ?? Math.random()} style={{ padding: 8, border: "1px solid #eee", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Weeks {f.StartWeek} → {f.EndWeek}</div>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>
                      Status: <b>{f.Status}</b> &nbsp;|&nbsp; Requested: {new Date(f.CreatedAt).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    {f.Status === "Approved" ? (
                      <button
                        onClick={() => resumeCourse(f.FreezeID ?? f.FreezeId)}
                        disabled={freezeSubmitting}
                        style={{ background: "#16a34a", color: "white", padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer" }}
                      >
                        {freezeSubmitting ? "Processing..." : "Resume Course"}
                      </button>
                    ) : (
                      <div style={{ fontSize: 13, color: "#6b7280" }}>{f.Status}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {freezeModalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999
        }}>
          <div style={{ background: "white", padding: 24, borderRadius: 12, minWidth: 320 }}>
            <h3>Request Course Freeze</h3>
            <div style={{ marginTop: 12 }}>
              <label>Start Week:</label>
              <input
                type="number"
                min={1}
                max={data.weeks?.length ?? 52}
                value={freezeStartWeek}
                onChange={(e) => setFreezeStartWeek(Number(e.target.value))}
                style={{ marginLeft: 8, width: 60 }}
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <label>End Week:</label>
              <input
                type="number"
                min={1}
                max={data.weeks?.length ?? 52}
                value={freezeEndWeek}
                onChange={(e) => setFreezeEndWeek(Number(e.target.value))}
                style={{ marginLeft: 8, width: 60 }}
              />
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
              <button
                onClick={submitCourseFreeze}
                disabled={freezeSubmitting}
                style={{ background: "#ef4444", color: "white", padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer" }}
              >
                {freezeSubmitting ? "Submitting..." : "Submit"}
              </button>
              <button
                onClick={() => setFreezeModalOpen(false)}
                style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #ccc", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- Weeks, Lectures, Quiz, Assignments -------------------- */}
      {(!data.weeks || data.weeks.length === 0) ? (
        <p>No lectures uploaded yet.</p>
      ) : (
        data.weeks.map((w) => {
          const weekNo = w.weekNo ?? w.weekNumber ?? w.week ?? w.studentWeekNo;
          const isUnlocked = !!w.isUnlocked || weekNo === 1;
          const { quiz, assignments } = getPrimaryQABlock(w);

          return (
            <div key={weekNo} style={{ border: "1px solid #eee", borderRadius: 8, marginBottom: 12 }}>
              <div
                onClick={() => toggleWeek(weekNo, isUnlocked)}
                style={{
                  padding: "12px 16px",
                  background: "#fafafa",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: isUnlocked ? "pointer" : "not-allowed",
                  fontWeight: 600,
                  opacity: isUnlocked ? 1 : 0.65,
                }}
              >
                <span>{w.label ?? `Week ${weekNo}`}</span>
                <span>{openWeeks[weekNo] ? "▲" : "▼"}</span>
              </div>

              {openWeeks[weekNo] && isUnlocked && (
                <div style={{ padding: 16, background: "white" }}>
                  {/* Lectures */}
                  {(w.lectures || []).map((lec, idx) => {
                    const title = lec.title || lec.content || lec.lectureTitle || `Lecture ${idx + 1}`;
                    const assets = lec.assets || [];
                    const lecKey = lec.lecturePlanId ?? lec.lectureId ?? lec.lessonId ?? `lec-${idx}`;

                    return (
                      <div key={lecKey} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px dashed #e6e6e6", padding: 10, borderRadius: 8, marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>Lecture {lec.order ?? lec.lectureNumber ?? idx + 1}</div>
                          <div style={{ fontSize: 13, opacity: 0.85 }}>{title}</div>
                        </div>
                        <div>
                          {assets.length > 0 ? assets.map((a, i) => (
                            <a key={i} href={a.link || a.FilePath || a.filePath || a.fileUrl || "#"} target="_blank" rel="noreferrer" style={{ padding: "6px 10px", borderRadius: 8, textDecoration: "none", border: "1px solid #111", marginLeft: 6 }}>Open</a>
                          )) : <button disabled>No File</button>}
                        </div>
                      </div>
                    );
                  })}

                  {/* Quiz */}
                  {quiz ? (
                    <button
                      onClick={() => navigate(`/student-dashboard/quiz/${quiz.qid ?? quiz.QID ?? quiz.id ?? quiz.QuizID}`)}
                      style={{ marginTop: 8, marginBottom: 8 }}
                    >
                      Start Quiz
                    </button>
                  ) : (
                    <div style={{ marginTop: 8, opacity: 0.7 }}>Quiz not posted yet</div>
                  )}

                  {/* Assignments */}
                  {assignments && assignments.length > 0 ? (
                    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      {assignments.map((assignment) => {
                        const aid = resolveAssignmentId(assignment);
                        const fileUrl = getAssignmentFileUrl(assignment);
                        const alreadySubmitted = isAssignmentAlreadySubmitted(assignment);

                        return (
                          <div key={aid ?? Math.random()} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                            <a href={fileUrl || "#"} target="_blank" rel="noreferrer">Open Assignment</a>

                            <div style={{ fontSize: 13, color: "#374151" }}>
                              {assignment.tMarks ?? assignment.T_Marks ? `Marks: ${assignment.tMarks ?? assignment.T_Marks}` : null}
                            </div>

                            <div>
                              {alreadySubmitted ? (
                                <button disabled>Submitted</button>
                              ) : (
                                <button onClick={() => openFilePickerForAssignment(assignment)} disabled={uploadingAssignmentId !== null}>
                                  {uploadingAssignmentId === aid ? `Uploading ${uploadProgress}%` : "Submit Assignment"}
                                </button>
                              )}
                            </div>

                            {uploadingAssignmentId === aid && (
                              <div style={{ minWidth: 140 }}>
                                <div style={{ fontSize: 12, marginBottom: 4 }}>{uploadProgress}% uploaded</div>
                                <div style={{ height: 6, background: "#eee", borderRadius: 6 }}>
                                  <div style={{ width: `${uploadProgress}%`, height: "100%", borderRadius: 6, background: "#4caf50", transition: "width 200ms linear" }} />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ marginTop: 8, opacity: 0.7 }}>Assignment not posted yet</div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* ---------------------- Rate Course & Certificate ---------------------- */}
      <div style={{ marginTop: 18, textAlign: "center" }}>
        {isCourseCompleted ? (
          <>
            <button onClick={() => navigate(`/student-dashboard/courses/${courseId}/rate`)} style={{ background: "#f59e0b", color: "white", padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", marginRight: 12 }}>
              Rate This Course
            </button>

            <span style={{ marginRight: 8, fontWeight: 600 }}>Certificate:</span>

            {certificateStatus === "NotRequested" && (
              <button onClick={requestCertificate} style={{ background: "#2563eb", color: "white", padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer" }}>
                Request Certificate
              </button>
            )}

            {certificateStatus === "Pending" && <span style={{ marginLeft: 12 }}>⏳ Certificate request pending...</span>}
            {certificateStatus === "Rejected" && <span style={{ marginLeft: 12, color: "red" }}>❌ Certificate request was rejected</span>}
            {(certificateStatus === "Issued" || certificateStatus === "Approved") && (
              <button onClick={downloadCertificate} style={{ background: "#16a34a", color: "white", padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", marginLeft: 12 }}>
                Download Certificate
              </button>
            )}
          </>
        ) : (
          <div style={{ color: "#6b7280" }}>Complete the course to be able to rate it and request a certificate.</div>
        )}
      </div>
    </div>
  );
}
