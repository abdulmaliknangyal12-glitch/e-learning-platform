import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from 'react-router-dom';

// Admin Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AddSemester from './pages/AddSemester';
import ViewSemesters from './Components/ViewSemesters';
import Courses from './pages/Courses';
import AddCourse from './pages/AddCourse';
import EditCourse from './pages/EditCourse';
import Teachers from './pages/Teachers';
import AddTeacher from './pages/AddTeacher';
import Students from './pages/Students';
import AddStudent from './pages/AddStudent';
import TeacherDetail from './pages/TeacherDetail';
import EditTeacher from './pages/EditTeacher';
import AssignCourse from './pages/AssignCourse';
import StudentDetail from './pages/StudentDetail';
import Ratings from './pages/Ratings'; 
import CertificateRequests from './pages/CertificateRequests'; 
import FreezeRequests from './pages/FreezeRequests';

// Teacher Pages
import TeacherDashboard from './pages/TeacherDashboard/TeacherDashboard';
import TeacherCourses from './pages/TeacherDashboard/TeacherCourses';
import TeacherStudents from './pages/TeacherDashboard/TeacherStudents';
import CourseDetail from './pages/TeacherDashboard/CourseDetail';
import AddLecture from './pages/TeacherDashboard/AddLecture';
import AddLecturePlan from './pages/TeacherDashboard/AddLecturePlan'; 
import EditLecturePlan from './pages/TeacherDashboard/EditLecturePlan';
import AddQuiz from './pages/TeacherDashboard/AddQuiz';
import AddAssignment from './pages/TeacherDashboard/AddAssignment';
import AssignmentList from './pages/TeacherDashboard/AssignmentList';
import AddQuestions from './pages/TeacherDashboard/AddQuestions';
import QuizDetails from './pages/TeacherDashboard/QuizDetails';
import EditQuiz from './pages/TeacherDashboard/EditQuiz';
import ViewQuizz from './pages/TeacherDashboard/ViewQuizz';
import StudentProgress from './pages/TeacherDashboard/StudentProgress';
import TeacherRatings from './pages/TeacherDashboard/TeacherRatings';
import TeacherAssignments from './pages/TeacherDashboard/TeacherAssignments';
import StudentStatusList from './pages/TeacherDashboard/StudentStatusList';

// Student Pages
import StudentDashboard from './pages/StudentDashboard/StudentDashboard';
import EnrolledCourses from './pages/StudentDashboard/EnrolledCourses';
import ActiveCourses from './pages/StudentDashboard/ActiveCourses';
import StudentCourseDetail from './pages/StudentDashboard/StudentCourseDetail';
import QuizAttemptPage from './pages/StudentDashboard/QuizAttemptPage';
import StudentAssignment from './pages/StudentDashboard/StudentAssignment';
import RateCourse from './pages/StudentDashboard/RateCourse';
import StudentCertificates from './pages/StudentDashboard/StudentCertificates';

// Layouts
import AdminLayout from './layout/AdminLayout';
import TeacherLayout from './layout/TeacherLayout';
import StudentLayout from './layout/StudentLayout';

// Wrapper to pass courseId from URL to StudentStatusList
function StudentStatusListWrapper() {
  const { courseId } = useParams();
  return <StudentStatusList courseId={courseId} />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public / Auth */}
        <Route path="/" element={<Login />} />

        {/* Admin Routes */}
        <Route path="/dashboard" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="home" element={<AdminDashboard />} />
          <Route path="ratings" element={<Ratings />} />
          <Route path="add-semester" element={<AddSemester />} />
          <Route path="view-semesters" element={<ViewSemesters />} />
          <Route path="courses" element={<Courses />} />
          <Route path="add-course" element={<AddCourse />} />
          <Route path="edit-course/:id" element={<EditCourse />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="teachers/add" element={<AddTeacher />} />
          <Route path="teachers/detail/:id" element={<TeacherDetail />} />
          <Route path="assign-course/:id" element={<AssignCourse />} />
          <Route path="teachers/edit/:id" element={<EditTeacher />} />
          <Route path="students" element={<Students />} />
          <Route path="add-students" element={<AddStudent />} />
          <Route path="students/:id" element={<StudentDetail />} />
          <Route path="freeze-requests" element={<FreezeRequests />} />
          <Route path="certificates" element={<CertificateRequests />} /> 
        </Route>

        {/* Teacher Routes */}
        <Route path="/teacher-dashboard" element={<TeacherLayout />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="teacher-courses" element={<TeacherCourses />} />
          <Route path="teacher-students" element={<TeacherStudents />} />
          <Route path="ratings" element={<TeacherRatings />} />
          <Route path=":courseId/details" element={<CourseDetail />} />
          <Route path=":courseId/add-lecture-plan" element={<AddLecturePlan />} />
          <Route path=":courseId/edit-lecture-plan/:lid" element={<EditLecturePlan />} />
          <Route path=":courseId/add-lecture" element={<AddLecture />} />
          <Route path=":courseId/add-quiz" element={<AddQuiz />} />
          <Route path=":courseId/lecture/:lectureId/add-quiz" element={<AddQuiz />} />
          <Route path=":courseId/assignments" element={<AssignmentList />} />
          <Route path=":courseId/quizzes/:quizId/add-questions" element={<AddQuestions />} />
          <Route path=":courseId/quizzes/:quizId/details" element={<QuizDetails />} />
          <Route path=":courseId/lecture/:lectureId/add-assignment" element={<AddAssignment />} />
          <Route path=":courseId/assignments/pending" element={<TeacherAssignments />} />
          <Route path="quiz/:quizId/edit" element={<EditQuiz />} />
          <Route path="quiz/:quizId/details" element={<ViewQuizz />} />
          <Route path="course/:courseId/student/:studentId/progress" element={<StudentProgress />} />
          
          {/* ✅ Fixed nested relative path for StudentStatusList */}
          <Route path="course/:courseId/students" element={<StudentStatusListWrapper />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student-dashboard" element={<StudentLayout />}>
          <Route index element={<StudentDashboard />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="enrolled-courses" element={<EnrolledCourses />} />
          <Route path="active-courses" element={<ActiveCourses />} />
          <Route path="courses/:enrollId" element={<StudentCourseDetail />} />
          <Route path="quiz/:quizId" element={<QuizAttemptPage />} />
          <Route path=":courseId/assignments/:assignmentId/submit" element={<StudentAssignment />} />
          <Route path="courses/:courseId/rate" element={<RateCourse />} />
          <Route path="certificates" element={<StudentCertificates />} />
        </Route>

        {/* Redirects / fallback */}
        <Route path="/login-success" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
