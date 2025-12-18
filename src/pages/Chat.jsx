// src/pages/Chat.jsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

export default function Chat() {
  const { chatId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [otherUser, setOtherUser] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const currentUser = auth.currentUser;

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  // Derive other participant uid from chatId
  useEffect(() => {
    if (!currentUser || !chatId) return;
    const [a, b] = chatId.split("_");
    const otherUid = a === currentUser.uid ? b : a;

    const loadOtherUser = async () => {
      try {
        const ref = doc(db, "players", otherUid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setOtherUser({ uid: otherUid, ...snap.data() });
        } else {
          setOtherUser({ uid: otherUid, name: "Player" });
        }
      } catch {
        setOtherUser({ uid: otherUid, name: "Player" });
      }
    };

    loadOtherUser();
  }, [chatId, currentUser]);

  // Listen to messages in this chat
  useEffect(() => {
    if (!chatId) return;
    const msgsRef = collection(db, "chats", chatId, "messages");
    const q = query(msgsRef, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(list);
      // scroll to bottom on new messages
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    });

    return () => unsub();
  }, [chatId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !currentUser) return;

    setSending(true);
    try {
      const [a, b] = chatId.split("_");
      const otherUid = a === currentUser.uid ? b : a;

      const msgsRef = collection(db, "chats", chatId, "messages");

      await addDoc(msgsRef, {
        from: currentUser.uid,
        to: otherUid,
        text: text.trim(),
        createdAt: serverTimestamp(),
      });

      // ensure chat doc exists / update lastMessageAt
      await setDoc(
        doc(db, "chats", chatId),
        {
          participants: [currentUser.uid, otherUid],
          lastMessageAt: serverTimestamp(),
        },
        { merge: true }
      );

      setText("");
    } catch {
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="pt-20 h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="px-4 py-3 bg-white shadow flex items-center gap-3">
        <button
          className="text-blue-600 font-semibold"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <div className="flex items-center gap-3">
          <img
            src={
              otherUser?.imageUrl ||
              "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            }
            alt={otherUser?.name || "Player"}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="font-semibold">
              {otherUser?.name || "Player"}
            </p>
            <p className="text-xs text-gray-500">
              {otherUser?.sport || "GameBuddy user"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-gray-500 mt-4">
            Say hi and start the conversation.
          </p>
        )}

        {messages.map((m) => {
          const isMe = m.from === currentUser.uid;
          return (
            <div
              key={m.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs rounded-2xl px-3 py-2 text-sm ${
                  isMe
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white text-gray-900 rounded-bl-none shadow"
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input box */}
      <form
        onSubmit={sendMessage}
        className="p-3 bg-white border-t flex items-center gap-2"
      >
        <input
          type="text"
          className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-60"
        >
          Send
        </button>
      </form>
    </div>
  );
}
