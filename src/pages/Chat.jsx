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
import { FaArrowLeft, FaPaperPlane } from "react-icons/fa";
import { GiLightningShield } from "react-icons/gi";

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

  const otherName = otherUser?.name || "Player";
  const otherSport = otherUser?.sport || "GameBuddy user";
  const otherPhoto =
    otherUser?.imageUrl ||
    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

  return (
    <div className="relative min-h-screen bg-[#050816] text-white pt-20">
      {/* background glows */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.28),_transparent_60%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(34,197,94,0.22),_transparent_55%)]" />

      <div className="relative z-10 flex flex-col h-[calc(100vh-5rem)] max-w-3xl mx-auto bg-black/10 border-x border-white/5">
        {/* Header */}
        <div className="px-3 sm:px-4 py-3 bg-black/60 border-b border-white/10 flex items-center gap-3">
          <button
            type="button"
            className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-sm"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft />
          </button>
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <img
                src={otherPhoto}
                alt={otherName}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover bg-[#020617]"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-400 border border-black" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-base truncate">
                {otherName}
              </p>
              <p className="text-[11px] sm:text-xs text-gray-300 truncate">
                {otherSport}
              </p>
            </div>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-1 text-[11px] text-gray-300">
            <GiLightningShield className="text-hero-yellow text-lg" />
            <span>Private 1:1 chat</span>
          </div>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-2 sm:space-y-3 bg-black/20">
          {messages.length === 0 && (
            <p className="text-center text-gray-300 mt-4 text-sm">
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
                  className={`max-w-[78%] sm:max-w-xs px-3 py-2 rounded-2xl text-sm break-words ${
                    isMe
                      ? "bg-gradient-to-r from-hero-blue to-hero-green text-white rounded-br-sm shadow-lg shadow-hero-blue/40"
                      : "bg-white/90 text-gray-900 rounded-bl-sm shadow"
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
          className="p-2 sm:p-3 bg-black/70 border-t border-white/10 flex items-center gap-2"
        >
          <input
            type="text"
            className="flex-1 rounded-full px-3 sm:px-4 py-2 text-sm bg-[#020617] border border-white/15 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-hero-blue"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="inline-flex items-center justify-center bg-hero-blue hover:bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed gap-1"
          >
            <FaPaperPlane className="text-xs" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
