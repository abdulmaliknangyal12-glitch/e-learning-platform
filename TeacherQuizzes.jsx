import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function TeacherQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        // ✅ Fetch all quizzes uploaded by teacher
        const res = await axios.get("http://localhost:5000/api/teacher/quizzes");
        setQuizzes(res.data || []);
      } catch (err) {
        console.error("❌ Failed to fetch quizzes", err);
      }
    };
    fetchQuizzes();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">My Uploaded Quizzes</h2>

      {quizzes.length === 0 ? (
        <p>No quizzes uploaded yet.</p>
      ) : (
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2 text-left">Quiz Title</th>
              <th className="border px-4 py-2 text-center">Course</th>
              <th className="border px-4 py-2 text-center">Questions</th>
              <th className="border px-4 py-2 text-center">Marks</th>
              <th className="border px-4 py-2 text-center">Created At</th>
              <th className="border px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((quiz) => (
              <tr key={quiz.QID}>
                <td className="border px-4 py-2">{quiz.QuizTitle}</td>
                <td className="border px-4 py-2 text-center">{quiz.CourseName ?? "-"}</td>
                <td className="border px-4 py-2 text-center">{quiz.TQUES}</td>
                <td className="border px-4 py-2 text-center">{quiz.TotalMarks}</td>
                <td className="border px-4 py-2 text-center">
                  {quiz.CreatedAt ? new Date(quiz.CreatedAt).toLocaleDateString() : "-"}
                </td>
                <td className="border px-4 py-2 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => navigate(`/teacher-dashboard/quiz/${quiz.QID}/details`)}
                      className="btn-pdf"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/teacher-dashboard/quiz/${quiz.QID}/edit`)}
                      className="btn-quiz"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (!window.confirm("Delete this quiz?")) return;
                        try {
                          await axios.delete(`http://localhost:5000/api/teacher/quizzes/${quiz.QID}`);
                          setQuizzes((prev) => prev.filter((q) => q.QID !== quiz.QID));
                        } catch (err) {
                          console.error(err);
                          alert("Failed to delete quiz");
                        }
                      }}
                      className="btn-delete"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
