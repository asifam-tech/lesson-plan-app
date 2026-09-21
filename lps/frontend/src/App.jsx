import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute, { roleHome } from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import CreateLesson from './pages/CreateLesson';
import UploadLesson from './pages/UploadLesson';
import MyLessonPlans from './pages/MyLessonPlans';
import Notifications from './pages/Notifications';
import LessonDetails from './pages/LessonDetails';
import Profile from './pages/Profile';
import DepartmentDashboard from './pages/DepartmentDashboard';
import DirectorDashboard from './pages/DirectorDashboard';
import LessonQueue from './pages/LessonQueue';
import Reports from './pages/Reports';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${roleHome(user.role)}`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Teacher */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/create"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <CreateLesson />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/upload"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <UploadLesson />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/my-plans"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <MyLessonPlans />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/notifications"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/profile"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/plans/:id"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <LessonDetails />
              </ProtectedRoute>
            }
          />

          {/* Department Head */}
          <Route
            path="/department"
            element={
              <ProtectedRoute allowedRoles={['department_head']}>
                <DepartmentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/department/pending"
            element={
              <ProtectedRoute allowedRoles={['department_head']}>
                <LessonQueue
                  title="Pending lesson plans"
                  description="Lesson plans waiting for your review."
                  statusFilter="pending"
                  basePath="/department/plans"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/department/approved"
            element={
              <ProtectedRoute allowedRoles={['department_head']}>
                <LessonQueue
                  title="Approved plans"
                  description="Lesson plans you've approved."
                  statusFilter={['dept_approved', 'director_approved', 'director_rejected']}
                  basePath="/department/plans"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/department/rejected"
            element={
              <ProtectedRoute allowedRoles={['department_head']}>
                <LessonQueue
                  title="Rejected plans"
                  description="Lesson plans you've sent back to teachers."
                  statusFilter="dept_rejected"
                  basePath="/department/plans"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/department/reports"
            element={
              <ProtectedRoute allowedRoles={['department_head']}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/department/profile"
            element={
              <ProtectedRoute allowedRoles={['department_head']}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/department/plans/:id"
            element={
              <ProtectedRoute allowedRoles={['department_head']}>
                <LessonDetails />
              </ProtectedRoute>
            }
          />

          {/* Director */}
          <Route
            path="/director"
            element={
              <ProtectedRoute allowedRoles={['director']}>
                <DirectorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/director/pending"
            element={
              <ProtectedRoute allowedRoles={['director']}>
                <LessonQueue
                  title="Pending approval"
                  description="Lesson plans approved by department heads, awaiting your decision."
                  statusFilter="dept_approved"
                  basePath="/director/plans"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/director/approved"
            element={
              <ProtectedRoute allowedRoles={['director']}>
                <LessonQueue
                  title="Approved plans"
                  description="Lesson plans with final approval."
                  statusFilter="director_approved"
                  basePath="/director/plans"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/director/rejected"
            element={
              <ProtectedRoute allowedRoles={['director']}>
                <LessonQueue
                  title="Rejected plans"
                  description="Lesson plans you've sent back to teachers."
                  statusFilter="director_rejected"
                  basePath="/director/plans"
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/director/reports"
            element={
              <ProtectedRoute allowedRoles={['director']}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/director/profile"
            element={
              <ProtectedRoute allowedRoles={['director']}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/director/plans/:id"
            element={
              <ProtectedRoute allowedRoles={['director']}>
                <LessonDetails />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
