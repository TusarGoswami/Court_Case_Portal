import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CreateCase from "./pages/CreateCase";
import ProfileSettings from "./pages/ProfileSettings";
import JudgePanel from "./pages/JudgePanel";
import JudgeProfileView from "./pages/JudgeProfileView";
import { Navigate } from "react-router-dom";
import { getDefaultRouteForRole, getStoredToken, getStoredUser } from "./services/auth";

function ProtectedRoute({ children }) {
  const token = getStoredToken();
  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const user = getStoredUser();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              {user?.role === "judge" ? <Navigate to={getDefaultRouteForRole(user.role)} replace /> : <Dashboard />}
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-case"
          element={
            <ProtectedRoute>
              <CreateCase />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/judge-panel"
          element={
            <ProtectedRoute>
              <JudgePanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/judge-profile/:id"
          element={
            <ProtectedRoute>
              <JudgeProfileView />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;