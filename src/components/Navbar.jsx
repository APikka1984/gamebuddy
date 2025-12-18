// src/components/Navbar.jsx - FULLY UPDATED
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function Navbar() {
  const user = useSelector((state) => state.user);
  const isLoggedIn = Boolean(user?.uid);
  const [pendingCount, setPendingCount] = useState(0);

  const baseLink = "hover:opacity-75 transition-colors duration-150";
  const getClass = ({ isActive }) =>
    `${baseLink} ${isActive ? "font-semibold underline" : ""}`;

  useEffect(() => {
    if (!isLoggedIn || !user?.uid) {
      setPendingCount(0);
      return;
    }

    const reqRef = collection(db, "chatRequests");
    const qRef = query(
      reqRef,
      where("toUid", "==", user.uid),
      where("status", "==", "pending")
    );

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        setPendingCount(snap.size);
      },
      (err) => {
        console.warn("Navbar pendingCount error:", err.message);
        setPendingCount(0);
      }
    );

    return () => unsub();
  }, [isLoggedIn, user?.uid]);

  return (
    <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center shadow-md fixed top-0 w-full z-50">
      <h1 className="font-bold text-xl tracking-wide">GameBuddy</h1>

      <div className="flex gap-6">
        <NavLink to="/" className={getClass}>
          Find Players
        </NavLink>

        {!isLoggedIn && (
          <>
            <NavLink to="/login" className={getClass}>
              Login
            </NavLink>
            <NavLink to="/signup" className={getClass}>
              Signup
            </NavLink>
          </>
        )}

        {isLoggedIn && (
          <>
            <NavLink to="/profile" className={getClass}>
              Profile
            </NavLink>
            <NavLink to="/chats" className={getClass}>
              Chats
            </NavLink>
            <NavLink to="/games" className={getClass}>
              Games
            </NavLink>
            <NavLink to="/requests" className={getClass}>
              Requests
              {pendingCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center text-xs bg-red-500 rounded-full px-1.5 py-0.5">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
