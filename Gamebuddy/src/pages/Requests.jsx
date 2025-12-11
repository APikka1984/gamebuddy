// src/pages/Requests.jsx
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
      return;
    }

    const reqRef = collection(db, "chatRequests");
    const q = query(
      reqRef,
      where("toUid", "==", currentUser.uid),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      async (snap) => {
        const rows = [];
        for (const d of snap.docs) {
          const data = d.data();
          const fromUid = data.fromUid;
          let fromUser = { uid: fromUid, name: "Player" };

          try {
            const userSnap = await getDoc(doc(db, "players", fromUid));
            if (userSnap.exists()) {
              fromUser = { uid: fromUid, ...userSnap.data() };
            }
          } catch {
            // ignore
          }

          rows.push({
            id: d.id,
            fromUser,
            sport: data.sport,
            message: data.message,
            createdAt: data.createdAt?.toDate() || null,
          });
        }
        setRequests(rows);
        setLoading(false);
      },
      (err) => {
        console.warn("Requests listener error:", err.message);
        setRequests([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser, navigate]);

  const handleAccept = async (req) => {
    if (!currentUser) return;
    const requestId = req.id;
    const fromUid = req.fromUser.uid;
    const toUid = currentUser.uid;
    const chatId = [fromUid, toUid].sort().join("_");

    try {
      // 1) Mark request as accepted
      await updateDoc(doc(db, "chatRequests", requestId), {
        status: "accepted",
        respondedAt: serverTimestamp(),
      });

      // 2) Ensure chat room exists
      await setDoc(
        doc(db, "chats", chatId),
        {
          participants: [fromUid, toUid],
          lastMessageAt: serverTimestamp(),
          lastMessageText: "Chat request accepted. Say hi!",
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 3) Navigate to chat
      navigate(`/chat/${chatId}`);
    } catch (err) {
      console.error("Accept request error:", err);
      alert("Failed to accept request. Please try again.");
    }
  };

  const handleReject = async (req) => {
    try {
      await updateDoc(doc(db, "chatRequests", req.id), {
        status: "rejected",
        respondedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Reject request error:", err);
      alert("Failed to reject request. Please try again.");
    }
  };

  if (!currentUser) return null;

  return (
    <div className="pt-20 px-4 min-h-screen bg-gray-100">
      <h2 className="text-2xl font-bold text-blue-600 mb-4">
        Chat Requests
      </h2>

      {loading ? (
        <p className="text-gray-600">Loading requests...</p>
      ) : requests.length === 0 ? (
        <p className="text-gray-500">
          No pending chat requests right now.
        </p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className="w-full bg-white rounded-xl shadow flex items-center gap-3 px-4 py-3"
            >
              <img
                src={
                  r.fromUser.imageUrl ||
                  "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                }
                alt={r.fromUser.name || "Player"}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="font-semibold">
                  {r.fromUser.name || "Player"}
                </p>
                <p className="text-xs text-gray-500">
                  {r.sport || "Sport"} •{" "}
                  {r.createdAt
                    ? r.createdAt.toLocaleString()
                    : "Just now"}
                </p>
                {r.message && (
                  <p className="text-sm text-gray-700 mt-1">
                    {r.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleAccept(r)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleReject(r)}
                  className="bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-400"
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
