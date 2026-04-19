import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import AuthCard from "./components/AuthCard";
import Dashboard from "./components/Dashboard";
import Footer from "./components/Footer";
import Home from "./components/Home";
import Navbar from "./components/Navbar";
import RoomSelector from "./components/RoomSelector";
import { clearStoredRoom, clearStoredToken, getCurrentUser, getStoredRoom, getStoredToken, storeRoom } from "./lib/api";
import type { AppUser } from "./lib/types";

type DashboardSection =
  | "overview"
  | "add-expense"
  | "all-expenses"
  | "members"
  | "monthly-reports"
  | "settings";

function DashboardRoute({
  user,
  onRoomChange,
  onLogout,
  section,
}: {
  user: AppUser;
  onRoomChange: (code: string | null) => void;
  onLogout: () => void;
  section: DashboardSection;
}) {
  const params = useParams();
  const navigate = useNavigate();
  const roomCode = params.roomCode?.toUpperCase();

  useEffect(() => {
    if (roomCode) {
      onRoomChange(roomCode);
    }
  }, [onRoomChange, roomCode]);

  if (!roomCode) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <RoomSelector
          user={user}
          onJoin={(code) => {
            onRoomChange(code);
            navigate(`/dashboard/${code}`);
          }}
        />
      </div>
    );
  }

  return (
    <Dashboard
      user={user}
      roomCode={roomCode}
      section={section}
      onLogout={onLogout}
      onBackToRooms={() => {
        onRoomChange(null);
        navigate("/dashboard");
      }}
    />
  );
}

function AppContent() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentRoom, setCurrentRoom] = useState<string | null>(getStoredRoom());
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const bootstrap = async () => {
      const token = getStoredToken();

      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser();
        setUser(response.user);
      } catch (error) {
        clearStoredToken();
        clearStoredRoom();
        setUser(null);
        setCurrentRoom(null);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const handleRoomChange = React.useCallback((code: string | null) => {
    if (code) {
      storeRoom(code);
      setCurrentRoom(code);
      return;
    }

    clearStoredRoom();
    setCurrentRoom(null);
  }, []);

  const redirectTo = searchParams.get("redirect");

  const handleLogout = React.useCallback(() => {
    clearStoredToken();
    clearStoredRoom();
    setUser(null);
    setCurrentRoom(null);
    navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (location.pathname === "/login") {
      const destination = redirectTo || (currentRoom ? `/dashboard/${currentRoom}` : "/dashboard");
      navigate(destination, { replace: true });
    }
  }, [currentRoom, location.pathname, navigate, redirectTo, user]);

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (loading) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <motion.div
            animate={{ opacity: [0.45, 1, 0.45] }}
            transition={{ repeat: Infinity, duration: 1.25 }}
            className="rounded-full bg-white px-6 py-3 text-lg font-black tracking-tight text-slate-900 shadow-soft"
          >
            SplitMate
          </motion.div>
        </div>
      );
    }

    if (!user) {
      const redirectPath = `${location.pathname}${location.search}`;
      return <Navigate to={`/login?redirect=${encodeURIComponent(redirectPath)}`} replace />;
    }

    return <>{children}</>;
  };

  const isDashboardRoute = location.pathname.startsWith("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-brand-bg">
      {!isDashboardRoute && <Navbar user={user} setUser={setUser} currentRoom={currentRoom} />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home user={user} currentRoom={currentRoom} />} />
          <Route
            path="/login"
            element={
              loading ? null : user ? (
                <Navigate to={currentRoom ? `/dashboard/${currentRoom}` : "/dashboard"} replace />
              ) : (
                <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                  <AuthCard
                    initialIsRegister={searchParams.get("register") === "true"}
                    onAuthenticated={setUser}
                  />
                </div>
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRoute user={user!} onRoomChange={handleRoomChange} onLogout={handleLogout} section="overview" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/:roomCode"
            element={
              <ProtectedRoute>
                <DashboardRoute user={user!} onRoomChange={handleRoomChange} onLogout={handleLogout} section="overview" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/:roomCode/add-expense"
            element={
              <ProtectedRoute>
                <DashboardRoute user={user!} onRoomChange={handleRoomChange} onLogout={handleLogout} section="add-expense" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/:roomCode/all-expenses"
            element={
              <ProtectedRoute>
                <DashboardRoute user={user!} onRoomChange={handleRoomChange} onLogout={handleLogout} section="all-expenses" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/:roomCode/members"
            element={
              <ProtectedRoute>
                <DashboardRoute user={user!} onRoomChange={handleRoomChange} onLogout={handleLogout} section="members" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/:roomCode/monthly-reports"
            element={
              <ProtectedRoute>
                <DashboardRoute user={user!} onRoomChange={handleRoomChange} onLogout={handleLogout} section="monthly-reports" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/:roomCode/settings"
            element={
              <ProtectedRoute>
                <DashboardRoute user={user!} onRoomChange={handleRoomChange} onLogout={handleLogout} section="settings" />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isDashboardRoute && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
