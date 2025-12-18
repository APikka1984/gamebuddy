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
      <div className="pt-20 max-w-xl mx-auto p-4">
        <p className="text-center text-gray-600">
          Please log in to see your chat requests.
        </p>
      </div>
    );
  }

  return (
    <div className="pt-20 max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">Chat Requests</h1>

      {loading ? (
        <p className="text-gray-600">Loading requests...</p>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-600">
          <p>No pending chat requests right now.</p>
          <p className="mt-2">
            Go to{" "}
            <Link to="/" className="text-blue-600 underline">
              Find Players
            </Link>{" "}
            to send or receive requests.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl shadow p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <p className="font-semibold text-gray-800">
                  From: {req.fromName || req.fromUid}
                </p>
                <p className="text-sm text-gray-600">
                  Sport: {req.sport || "Any"}
                </p>
                {req.message && (
                  <p className="text-sm text-gray-500 mt-1">{req.message}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700"
                  onClick={() => handleRespond(req, "accepted")}
                >
                  Accept
                </button>
                <button
                  className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-200"
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
  );
}
