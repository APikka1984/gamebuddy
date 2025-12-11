// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import Navbar from "./components/Navbar";
import Login from "./pages/login";      // filename is `login.jsx`
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import FindPlayers from "./pages/FindPlayers";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import ChatsList from "./pages/ChatsList";
import AuthGate from "./components/AuthGate";
import Requests from "./pages/Requests";

function ProtectedRoute({ children }) {
  const user = useSelector((state) => state.user);
  const isLoggedIn = Boolean(user?.uid);
  return isLoggedIn ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthGate>
        <Navbar />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/players" element={<FindPlayers />} />
          <Route path="/players/:sport" element={<FindPlayers />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:chatId"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chats"
            element={
              <ProtectedRoute>
                <ChatsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <Requests />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthGate>
    </BrowserRouter>
  );
}
