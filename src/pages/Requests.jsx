// src/pages/Requests.jsx
import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useToast } from "../components/ToastManager";
import { GiLightningShield } from "react-icons/gi";

export default function Requests() {
  const user = useSelector((state) => state.user);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const addToast = useToast();

  useEffect(() => {
    if (!user?.uid) {
      setRequests([]);
      setLoading(false);
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
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRequests(list);
        setLoading(false);
      },
      (err) => {
        console.warn("pendingRequests listener error:", err.message);
        setRequests([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user?.uid]);

  const handleRespond = async (req, newStatus) => {
    try {
      const ref = doc(db, "chatRequests", req.id);
      await updateDoc(ref, { status: newStatus });
      if (newStatus === "accepted") {
        addToast("Request accepted! ✅");
      } else if (newStatus === "rejected") {
        addToast("Request rejected.", "error");
      }
    } catch (err) {
      console.error("Update request error:", err);
      addToast("Failed to update request.", "error");
    }
  };

  if (!user?.uid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] text-white px-4">
        <p className="text-center text-gray-300">
          Please log in to see your chat requests.
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050816] text-white pt-20 px-3 sm:px-4 pb-10">
      {/* background glows */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.28),_transparent_60%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(34,197,94,0.22),_transparent_55%)]" />

      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-5 sm:mb-6">
          <div>
            <div className="flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-hero-green/80">
              <GiLightningShield className="text-hero-yellow text-lg" />
              <span>Requests</span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-hero-yellow via-hero-green to-hero-blue bg-clip-text text-transparent">
              Chat requests
            </h1>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-300 text-sm mt-2">Loading requests...</p>
        ) : requests.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl shadow-xl shadow-hero-blue/20 backdrop-blur-md p-5 sm:p-6 text-center text-gray-200">
            <p>No pending chat requests right now.</p>
            <p className="mt-2 text-sm">
              Go to{" "}
              <Link to="/" className="text-hero-yellow underline">
                Find Players
              </Link>{" "}
              to send or receive requests.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="bg-white/5 border border-white/10 rounded-2xl shadow-lg shadow-hero-blue/20 backdrop-blur-md p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-base text-gray-50 truncate">
                    From: {req.fromName || req.fromUid}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-300">
                    Sport: {req.sport || "Any"}
                  </p>
                  {req.message && (
                    <p className="mt-1 text-xs sm:text-sm text-gray-400">
                      {req.message}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    className="bg-hero-green text-black px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-emerald-400"
                    onClick={() => handleRespond(req, "accepted")}
                  >
                    Accept
                  </button>
                  <button
                    className="bg-red-600/90 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold hover:bg-red-700"
                    onClick={() => handleRespond(req, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
