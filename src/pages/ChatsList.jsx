// src/pages/ChatsList.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { GiLightningShield } from "react-icons/gi";

export default function ChatsList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!currentUser) return;

    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastMessageAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      async (snap) => {
        const rows = [];
        for (const d of snap.docs) {
          const data = d.data();
          const chatId = d.id;
          const participants = data.participants || [];
          const otherUid =
            participants[0] === currentUser.uid
              ? participants[1]
              : participants[0];

          let otherUser = { uid: otherUid, name: "Player" };
          if (otherUid) {
            try {
              const userSnap = await getDoc(doc(db, "players", otherUid));
              if (userSnap.exists()) {
                otherUser = { uid: otherUid, ...userSnap.data() };
              }
            } catch {
              // keep fallback
            }
          }

          rows.push({
            chatId,
            otherUser,
            lastMessageText: data.lastMessageText || "Tap to chat",
            lastMessageAt: data.lastMessageAt
              ? data.lastMessageAt.toDate()
              : null,
          });
        }
        setItems(rows);
        setLoading(false);
      },
      (err) => {
        console.warn("ChatsList listener error:", err.message);
        setItems([]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentUser]);

  const openChat = (chatId) => {
    navigate(`/chat/${chatId}`);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="relative min-h-screen bg-[#050816] text-white pt-20 px-3 sm:px-4 pb-10">
      {/* background glows */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.28),_transparent_60%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(34,197,94,0.22),_transparent_55%)]" />

      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <div className="flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-hero-green/80">
              <GiLightningShield className="text-hero-yellow text-lg" />
              <span>Chats</span>
            </div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-hero-yellow via-hero-green to-hero-blue bg-clip-text text-transparent">
              Your squad conversations
            </h2>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-300 text-sm mt-4">Loading chats...</p>
        ) : items.length === 0 ? (
          <div className="mt-10 text-center text-gray-300">
            <p className="text-lg font-semibold mb-2">No chats yet</p>
            <p className="text-sm max-w-sm mx-auto">
              Go to{" "}
              <span className="font-semibold text-hero-yellow">
                Find Players
              </span>{" "}
              and send a chat request to start your first conversation.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4 mt-3">
            {items.map((item) => (
              <button
                key={item.chatId}
                onClick={() => openChat(item.chatId)}
                className="w-full rounded-2xl bg-white/5 border border-white/10 shadow-md shadow-hero-blue/25 backdrop-blur-md px-3 py-3 sm:px-4 sm:py-3 text-left flex items-center gap-3 hover:border-hero-yellow/70 hover:shadow-hero-yellow/30 hover:-translate-y-0.5 transition"
              >
                <div className="relative">
                  <img
                    src={
                      item.otherUser.imageUrl ||
                      "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                    }
                    alt={item.otherUser.name || "Player"}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover bg-[#020617]"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-400 border border-black" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm sm:text-base truncate">
                      {item.otherUser.name || "Player"}
                    </p>
                    {item.lastMessageAt && (
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        {item.lastMessageAt.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs sm:text-sm text-gray-300 truncate">
                    {item.lastMessageText}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
