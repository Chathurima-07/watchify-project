import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import AdminStudentDetails from "./pages/AdminStudentDetails";
import AdminMentorDetails from "./pages/AdminMentorDetails";
import MentorDashboard from "./pages/MentorDashboard";
import MentorExamDetails from "./pages/MentorExamDetails";
import StudentDashboard from "./pages/StudentDashboard";
import ExamPage from "./pages/ExamPage";
import StudentResultDetails from "./pages/StudentResultDetails";


// 🔒 Protected Route Component
const ProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // not logged in
  if (!token) {
    return <Navigate to="/" />;
  }

  // role mismatch
  if (role && user?.role !== role) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Login */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/student/:id"
          element={
            <ProtectedRoute role="admin">
              <AdminStudentDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mentor/:id"
          element={
            <ProtectedRoute role="admin">
              <AdminMentorDetails />
            </ProtectedRoute>
          }
        />

        {/* Mentor */}
        <Route
          path="/mentor"
          element={
            <ProtectedRoute role="mentor">
              <MentorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mentor/exam/:id"
          element={
            <ProtectedRoute role="mentor">
              <MentorExamDetails />
            </ProtectedRoute>
          }
        />

        {/* Student */}
        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam/:id"
          element={
            <ProtectedRoute role="student">
              <ExamPage />
            </ProtectedRoute>
          }
/>
        <Route
          path="/student/result/:id"
          element={
            <ProtectedRoute role="student">
              <StudentResultDetails />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;