// src/pages/Games.jsx - PICKUP GAMES + RSVP
import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { 
  collection, addDoc, onSnapshot, orderBy, query, serverTimestamp, 
  doc, updateDoc, deleteDoc 
} from "firebase/firestore";
import { useToast } from "../components/ToastManager";

export default function Games() {
  const [games, setGames] = useState([]);
  const [newGame, setNewGame] = useState({ 
    sport: "", 
    title: "", 
    time: "", 
    location: "",
    maxPlayers: 11
  });
  const [loading, setLoading] = useState(false);
  const addToast = useToast();
  const user = auth.currentUser;

  // Real-time games list
  useEffect(() => {
    const q = query(
      collection(db, "games"), 
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setGames(snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })));
    });
    return unsub;
  }, []);

  const createGame = async () => {
    if (!newGame.sport || !newGame.title || !newGame.time || !newGame.location) {
      addToast("Fill all fields", "error");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "games"), {
        ...newGame,
        hostUid: user.uid,
        hostName: user.displayName || user.email?.split("@")[0] || "Player",
        rsvps: { [user.uid]: "yes" },
        yesCount: 1,
        maybeCount: 0,
        noCount: 0,
        createdAt: serverTimestamp()
      });
      setNewGame({ sport: "", title: "", time: "", location: "", maxPlayers: 11 });
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
        [`${rsvpType}Count`]: rsvpType === "yes" ? 1 : 0
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

  if (!user) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 pt-20">
      <h1 className="text-4xl font-bold text-blue-600 mb-8 text-center">
        Pickup Games 🏏⚽🏸
      </h1>
      
      {/* CREATE GAME FORM */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-3xl shadow-2xl mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Create Pickup Game</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <select 
            className="p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200"
            value={newGame.sport}
            onChange={(e) => setNewGame({...newGame, sport: e.target.value})}
          >
            <option value="">Select Sport</option>
            <option value="cricket">Cricket 🏏</option>
            <option value="football">Football ⚽</option>
            <option value="badminton">Badminton 🏸</option>
            <option value="tennis">Tennis 🎾</option>
          </select>
          <input 
            className="p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200"
            placeholder="Game Title (e.g. 'Evening Cricket')" 
            value={newGame.title}
            onChange={(e) => setNewGame({...newGame, title: e.target.value})}
          />
          <input 
            className="p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200"
            type="datetime-local"
            value={newGame.time}
            onChange={(e) => setNewGame({...newGame, time: e.target.value})}
          />
          <input 
            className="p-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 md:col-span-2"
            placeholder="Location (Park name, ground)" 
            value={newGame.location}
            onChange={(e) => setNewGame({...newGame, location: e.target.value})}
          />
        </div>
        <button 
          className="mt-8 w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-8 rounded-2xl hover:from-green-600 hover:to-green-700 font-bold text-lg shadow-xl"
          onClick={createGame}
          disabled={loading}
        >
          {loading ? "Creating..." : `Create Game 🎾`}
        </button>
      </div>

      {/* GAMES LIST */}
      <div className="space-y-6">
        {games.map(game => (
          <div key={game.id} className="bg-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all border-2 border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-gray-800 mb-2">{game.title}</h3>
                <div className="flex flex-wrap gap-4 text-lg mb-2">
                  <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
                    {game.sport}
                  </span>
                  <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full">
                    {game.location}
                  </span>
                </div>
                <p className="text-gray-600 text-lg">
                  {new Date(game.time).toLocaleString('en-IN')}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Hosted by {game.hostName}
                </p>
              </div>
              
              <div className="flex gap-3">
                <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-lg shadow-lg">
                  {Object.keys(game.rsvps || {}).length} players
                </span>
                {game.hostUid === user.uid && (
                  <button
                    onClick={() => deleteGame(game.id)}
                    className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-red-600"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
            
            {/* RSVP BUTTONS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <button 
                className="bg-gradient-to-r from-green-500 to-green-600 text-white py-4 px-6 rounded-2xl font-bold hover:from-green-600 hover:to-green-700 shadow-lg transform hover:-translate-y-1 transition-all"
                onClick={() => rsvp(game.id, "yes")}
              >
                I'm In! ✅
              </button>
              <button 
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-800 py-4 px-6 rounded-2xl font-bold hover:from-yellow-500 hover:to-yellow-600 shadow-lg transform hover:-translate-y-1 transition-all"
                onClick={() => rsvp(game.id, "maybe")}
              >
                Maybe 🤔
              </button>
              <button 
                className="bg-gradient-to-r from-gray-400 to-gray-500 text-white py-4 px-6 rounded-2xl font-bold hover:from-gray-500 hover:to-gray-600 shadow-lg transform hover:-translate-y-1 transition-all"
                onClick={() => rsvp(game.id, "no")}
              >
                Pass 🙅
              </button>
            </div>
          </div>
        ))}
        {games.length === 0 && (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-500 mb-4">No games yet</p>
            <p>Create the first pickup game!</p>
          </div>
        )}
      </div>
    </div>
  );
}
