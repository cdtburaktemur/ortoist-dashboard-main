import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Dashboard from "@/pages/Dashboard";
import DoctorDashboard from "@/pages/DoctorDashboard";
import JobList from "@/pages/JobList";
import DoctorJobList from "@/pages/DoctorJobList";
import Statistics from "@/pages/Statistics";
import Profile from "@/pages/Profile";
import Preferences from "@/pages/Preferences";
import PriceList from "@/pages/PriceList";
import Login from "@/pages/Login";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  return children;
};

const AppContent = () => {
  const { isAuthenticated, currentUser } = useAuth();

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <div className="min-h-screen w-full bg-background">
      {isAuthenticated ? (
        <div className="flex h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background pt-16 px-4">
              <Routes>
                <Route path="/dashboard" element={
                  currentUser?.role === "doctor" 
                    ? <DoctorDashboard /> 
                    : <ProtectedRoute><Dashboard /></ProtectedRoute>
                } />
                <Route path="/job-list" element={
                  currentUser?.role === "doctor"
                    ? <DoctorJobList />
                    : <ProtectedRoute><JobList /></ProtectedRoute>
                } />
                <Route path="/price-list" element={<ProtectedRoute><PriceList /></ProtectedRoute>} />
                <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </main>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;