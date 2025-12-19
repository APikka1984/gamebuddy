// src/pages/Games.jsx - PICKUP GAMES + RSVP (themed + responsive)
import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useToast } from "../components/ToastManager";
import {
  FaFootballBall,
  FaBasketballBall,
} from "react-icons/fa";
import { MdSportsCricket } from "react-icons/md";
import { GiTennisRacket, GiWhistle } from "react-icons/gi";

export default function Games() {
  const [games, setGames] = useState([]);
  const [newGame, setNewGame] = useState({
    sport: "",
    title: "",
    time: "",
    location: "",
    maxPlayers: 11,
  });
  const [loading, setLoading] = useState(false);
  const addToast = useToast();
  const user = auth.currentUser;

  // Real-time games list
  useEffect(() => {
    const q = query(collection(db, "games"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setGames(
        snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }))
      );
    });
    return unsub;
  }, []);

  const createGame = async () => {
    if (
      !newGame.sport ||
      !newGame.title ||
      !newGame.time ||
      !newGame.location
    ) {
      addToast("Fill all fields", "error");
      return;
    }
    if (!user) {
      addToast("Please login first", "error");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "games"), {
        ...newGame,
        hostUid: user.uid,
        hostName:
          user.displayName || user.email?.split("@")[0] || "Player",
        rsvps: { [user.uid]: "yes" },
        yesCount: 1,
        maybeCount: 0,
        noCount: 0,
        createdAt: serverTimestamp(),
      });
      setNewGame({
        sport: "",
        title: "",
        time: "",
        location: "",
        maxPlayers: 11,
      });
      addToast("Game created! 🎾 Players can now RSVP");
    } catch (err) {
      addToast("Failed to create game", "error");
    }
    setLoading(false);
  };

  const rsvp = async (gameId, rsvpType) => {
    if (!user) return;
    try {
      const gameRef = doc(db, "games", gameId);
      await updateDoc(gameRef, {
        [`rsvps.${user.uid}`]: rsvpType,
        [`${rsvpType}Count`]: rsvpType === "yes" ? 1 : 0,
      });
      addToast(`RSVP ${rsvpType.toUpperCase()}! ✅`);
    } catch (err) {
      addToast("RSVP failed", "error");
    }
  };

  const deleteGame = async (gameId) => {
    try {
      await deleteDoc(doc(db, "games", gameId));
      addToast("Game deleted");
    } catch (err) {
      addToast("Delete failed", "error");
    }
  };

  const sportIcon = (s) => {
    const name = (s || "").toLowerCase();
    if (name.includes("cricket")) return <MdSportsCricket />;
    if (name.includes("football") || name.includes("soccer"))
      return <FaFootballBall />;
    if (name.includes("badminton") || name.includes("tennis"))
      return <GiTennisRacket />;
    if (name.includes("basket")) return <FaBasketballBall />;
    return <GiWhistle />;
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] text-white">
        <p className="text-gray-300">Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050816] text-white pt-20 px-3 sm:px-4 pb-10">
      {/* background glows */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.28),_transparent_60%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(34,197,94,0.22),_transparent_55%)]" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-hero-green/80">
            <GiWhistle className="text-hero-yellow text-base" />
            <span>Pickup Games</span>
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-extrabold leading-snug">
            <span className="bg-gradient-to-r from-hero-yellow via-hero-green to-hero-blue bg-clip-text text-transparent">
              Host and join local matches.
            </span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-gray-300">
            Create a game, share the location, and let your squad RSVP in
            real time.
          </p>
        </div>

        {/* CREATE GAME FORM */}
        <div className="bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md shadow-2xl shadow-hero-blue/25 p-4 sm:p-6 md:p-7 mb-8">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-gray-100 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#020617] border border-white/15 text-hero-yellow text-xl">
              {sportIcon(newGame.sport || "game")}
            </span>
            Create Pickup Game
          </h2>
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <select
              className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-2xl bg-[#020617] border border-white/15 text-sm outline-none focus:ring-2 focus:ring-hero-blue"
              value={newGame.sport}
              onChange={(e) =>
                setNewGame({ ...newGame, sport: e.target.value })
              }
            >
              <option value="">Select Sport</option>
              <option value="cricket">Cricket 🏏</option>
              <option value="football">Football ⚽</option>
              <option value="badminton">Badminton 🏸</option>
              <option value="tennis">Tennis 🎾</option>
            </select>
            <input
              className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-2xl bg-[#020617] border border-white/15 text-sm outline-none focus:ring-2 focus:ring-hero-blue"
              placeholder="Game title (e.g. 'Evening Cricket')"
              value={newGame.title}
              onChange={(e) =>
                setNewGame({ ...newGame, title: e.target.value })
              }
            />
            <input
              className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-2xl bg-[#020617] border border-white/15 text-sm outline-none focus:ring-2 focus:ring-hero-blue"
              type="datetime-local"
              value={newGame.time}
              onChange={(e) =>
                setNewGame({ ...newGame, time: e.target.value })
              }
            />
            <input
              className="w-full px-3 py-2 sm:px-4 sm:py-3 rounded-2xl bg-[#020617] border border-white/15 text-sm outline-none focus:ring-2 focus:ring-hero-blue md:col-span-2"
              placeholder="Location (park name, ground)"
              value={newGame.location}
              onChange={(e) =>
                setNewGame({ ...newGame, location: e.target.value })
              }
            />
          </div>
          <button
            className="mt-5 sm:mt-6 w-full bg-gradient-to-r from-hero-green to-emerald-500 text-black py-2.5 sm:py-3 rounded-2xl hover:from-emerald-400 hover:to-emerald-500 font-semibold text-sm sm:text-base shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={createGame}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Game 🎾"}
          </button>
        </div>

        {/* GAMES LIST */}
        <div className="space-y-4 sm:space-y-6">
          {games.map((game) => (
            <div
              key={game.id}
              className="bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md shadow-xl shadow-hero-blue/25 p-4 sm:p-5 md:p-6 hover:border-hero-yellow/70 hover:shadow-hero-yellow/30 hover:-translate-y-0.5 transition"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 sm:mb-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#020617] border border-white/15 text-hero-yellow text-xl">
                      {sportIcon(game.sport)}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-50 truncate">
                      {game.title}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs sm:text-sm mb-2">
                    <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-200 px-3 py-1 rounded-full font-medium">
                      {game.sport}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-200 px-3 py-1 rounded-full">
                      {game.location}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base text-gray-200">
                    {game.time
                      ? new Date(game.time).toLocaleString("en-IN")
                      : "Time TBA"}
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-400 mt-1">
                    Hosted by {game.hostName}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="bg-gradient-to-r from-hero-blue to-hero-green text-white px-4 py-2 rounded-2xl font-semibold text-xs sm:text-sm shadow-lg whitespace-nowrap">
                    {(game.rsvps && Object.keys(game.rsvps).length) || 0}{" "}
                    players
                  </span>
                  {game.hostUid === user.uid && (
                    <button
                      onClick={() => deleteGame(game.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold hover:bg-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* RSVP BUTTONS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 pt-3 border-t border-white/10">
                <button
                  className="bg-gradient-to-r from-hero-green to-emerald-500 text-black py-2.5 rounded-2xl text-sm font-semibold hover:from-emerald-400 hover:to-emerald-500 shadow-lg transform hover:-translate-y-0.5 transition"
                  onClick={() => rsvp(game.id, "yes")}
                >
                  I&apos;m In! ✅
                </button>
                <button
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 py-2.5 rounded-2xl text-sm font-semibold hover:from-yellow-500 hover:to-yellow-600 shadow-lg transform hover:-translate-y-0.5 transition"
                  onClick={() => rsvp(game.id, "maybe")}
                >
                  Maybe 🤔
                </button>
                <button
                  className="bg-gradient-to-r from-gray-500 to-gray-600 text-white py-2.5 rounded-2xl text-sm font-semibold hover:from-gray-600 hover:to-gray-700 shadow-lg transform hover:-translate-y-0.5 transition"
                  onClick={() => rsvp(game.id, "no")}
                >
                  Pass 🙅
                </button>
              </div>
            </div>
          ))}

          {games.length === 0 && !loading && (
            <div className="text-center py-16 text-gray-300">
              <p className="text-xl sm:text-2xl mb-2">No games yet</p>
              <p className="text-sm">Create the first pickup game!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
