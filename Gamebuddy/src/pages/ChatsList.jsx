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

export default function ChatsList() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]); // [{ chatId, otherUser, lastMessageText, lastMessageAt }]
  const [loading, setLoading] = useState(true);

  const currentUser = auth.currentUser;

  // Redirect if not logged in
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

          // fetch other user's basic info
          let otherUser = { uid: otherUid, name: "Player" };
          if (otherUid) {
            try {
              const userSnap = await getDoc(doc(db, "players", otherUid));
              if (userSnap.exists()) {
                otherUser = { uid: otherUid, ...userSnap.data() };
              }
            } catch {
              // ignore, keep fallback
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
    <div className="pt-20 px-4 min-h-screen bg-gray-100">
      <h2 className="text-2xl font-bold text-blue-600 mb-4">Chats</h2>

      {loading ? (
        <p className="text-gray-600">Loading chats...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">No conversations yet. Start one from Find Players.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <button
              key={item.chatId}
              onClick={() => openChat(item.chatId)}
              className="w-full bg-white rounded-xl shadow flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
            >
              <img
                src={
                  item.otherUser.imageUrl ||
                  "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                }
                alt={item.otherUser.name || "Player"}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <p className="font-semibold">
                    {item.otherUser.name || "Player"}
                  </p>
                  {item.lastMessageAt && (
                    <span className="text-xs text-gray-400">
                      {item.lastMessageAt.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {item.lastMessageText}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
