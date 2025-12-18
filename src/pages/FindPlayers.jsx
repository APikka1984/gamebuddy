// src/pages/FindPlayers.jsx - FULLY UPDATED (REQUEST → CHAT)
import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  serverTimestamp,
  addDoc,
  onSnapshot,
} from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";

export default function FindPlayers() {
  const { sport } = useParams();
  const [players, setPlayers] = useState([]);
  const [currentUserLoc, setCurrentUserLoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [maxDistance, setMaxDistance] = useState(9999);
  const [ageFilter, setAgeFilter] = useState("any");
  const [pendingRequests, setPendingRequests] = useState(new Set());
  const [acceptedRequests, setAcceptedRequests] = useState(new Set());
  const navigate = useNavigate();

  // Haversine distance calculation
  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    if (lat1 == null || lat2 == null) return null;
    const R = 6371;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchCurrentUserLocation = async () => {
    if (!auth.currentUser) return;
    try {
      const uDoc = await getDoc(doc(db, "players", auth.currentUser.uid));
      if (uDoc.exists()) {
        const data = uDoc.data();
        if (data.latitude && data.longitude) {
          setCurrentUserLoc({
            latitude: data.latitude,
            longitude: data.longitude,
          });
        } else {
          setCurrentUserLoc(null);
        }
      }
    } catch (err) {
      console.warn("fetchCurrentUserLocation error:", err.message);
      setCurrentUserLoc(null);
    }
  };

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      let qRef;
      if (sport) {
        qRef = query(collection(db, "players"), where("sport", "==", sport));
      } else {
        qRef = collection(db, "players");
      }
      const snap = await getDocs(qRef);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPlayers(list);
    } catch (err) {
      console.warn("fetchPlayers error:", err.message);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCurrentUserLocation();
      fetchPlayers();
    }, 100);
    return () => clearTimeout(timer);
  }, [sport]);

  // Track pending requests sent by current user
  useEffect(() => {
    if (!auth.currentUser) {
      setPendingRequests(new Set());
      return;
    }

    const reqRef = collection(db, "chatRequests");
    const qRef = query(
      reqRef,
      where("fromUid", "==", auth.currentUser.uid),
      where("status", "==", "pending")
    );

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const ids = new Set();
        snap.forEach((d) => {
          const data = d.data();
          if (data.toUid) ids.add(data.toUid);
        });
        setPendingRequests(ids);
      },
      (err) => {
        console.warn("pendingRequests listener error:", err.message);
        setPendingRequests(new Set());
      }
    );

    return () => unsub();
  }, []);

  // Track accepted requests sent by current user (to show "Chat")
  useEffect(() => {
    if (!auth.currentUser) {
      setAcceptedRequests(new Set());
      return;
    }

    const reqRef = collection(db, "chatRequests");
    const qRef = query(
      reqRef,
      where("fromUid", "==", auth.currentUser.uid),
      where("status", "==", "accepted")
    );

    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const ids = new Set();
        snap.forEach((d) => {
          const data = d.data();
          if (data.toUid) ids.add(data.toUid);
        });
        setAcceptedRequests(ids);
      },
      (err) => {
        console.warn("acceptedRequests listener error:", err.message);
        setAcceptedRequests(new Set());
      }
    );

    return () => unsub();
  }, []);

  // Build chatId and navigate to chat page
  const buildChatId = (uid1, uid2) => {
    return [uid1, uid2].sort().join("_");
  };

  const startChat = (targetUid) => {
    if (!auth.currentUser) {
      alert("Please login first");
      navigate("/login");
      return;
    }
    const chatId = buildChatId(auth.currentUser.uid, targetUid);
    navigate(`/chat/${chatId}`);
  };

  // Send chat request
  const sendChatRequest = async (playerUid, playerName, playerSport) => {
    if (!auth.currentUser) {
      alert("Please login first");
      navigate("/login");
      return;
    }
    if (auth.currentUser.uid === playerUid) {
      alert("This is you 🙂");
      return;
    }

    try {
      // Prevent duplicate pending request from same user to same target
      const reqsRef = collection(db, "chatRequests");
      const qRef = query(
        reqsRef,
        where("fromUid", "==", auth.currentUser.uid),
        where("toUid", "==", playerUid),
        where("status", "==", "pending")
      );
      const existing = await getDocs(qRef);
      if (!existing.empty) {
        alert("You already sent a request. Please wait for a response.");
        return;
      }

      await addDoc(collection(db, "chatRequests"), {
        fromUid: auth.currentUser.uid,
        fromName:
          auth.currentUser.displayName ||
          auth.currentUser.email ||
          "Player",
        toUid: playerUid,
        toName: playerName || null,
        sport: playerSport || null,
        message: `Hi ${playerName || "player"}! Want to play ${
          playerSport || "today"
        }?`,
        status: "pending",
        createdAt: serverTimestamp(),
      });

      alert("Chat request sent!");
    } catch (err) {
      console.error("sendChatRequest error:", err);
      alert("Failed to send request. Please try again.");
    }
  };

  const parseAgeRange = (value) => {
    switch (value) {
      case "18-25":
        return { min: 18, max: 25 };
      case "26-35":
        return { min: 26, max: 35 };
      case "36+":
        return { min: 36, max: null };
      default:
        return { min: null, max: null };
    }
  };

  const renderStars = (rating = 0) => {
    const r = Math.max(0, Math.min(5, Number(rating) || 0));
    const full = Math.floor(r);
    const empty = 5 - full;
    return (
      <div className="flex items-center gap-1 text-yellow-400 text-sm">
        <span>{"★".repeat(full) + "☆".repeat(empty)}</span>
        <span className="text-gray-500 text-xs ml-1">{r.toFixed(1)}/5</span>
      </div>
    );
  };

  const renderedPlayers = players
    .map((p) => {
      const dist =
        currentUserLoc && p.latitude && p.longitude
          ? getDistanceKm(
              currentUserLoc.latitude,
              currentUserLoc.longitude,
              p.latitude,
              p.longitude
            )
          : null;
      const playerAge = p.age ? parseInt(p.age) : null;
      const isOnline = !!p.isOnline;
      return { ...p, distanceKm: dist, playerAge, isOnline };
    })
    .filter((p) => {
      if (maxDistance !== 9999) {
        if (p.distanceKm == null || p.distanceKm > maxDistance) return false;
      }
      const { min, max } = parseAgeRange(ageFilter);
      if (min !== null && (!p.playerAge || p.playerAge < min)) return false;
      if (max !== null && p.playerAge > max) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });

  return (
    <div className="px-8 pt-28 min-h-screen bg-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-3xl font-bold text-blue-600">
          {sport ? `${sport} Players` : "Find Players"}
        </h2>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Distance:</label>
            <select
              className="p-2 border rounded"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
            >
              <option value={9999}>Any</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Age:</label>
            <select
              className="p-2 border rounded"
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
            >
              <option value="any">Any</option>
              <option value="18-25">18–25</option>
              <option value="26-35">26–35</option>
              <option value="36+">36+</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-600">Loading players...</p>
      ) : renderedPlayers.length === 0 ? (
        <p className="text-center text-gray-500">
          No players found matching your filters.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {renderedPlayers.map((p) => {
            const targetUid = p.uid || p.id;
            const isRequested = pendingRequests.has(targetUid);
            const isAccepted = acceptedRequests.has(targetUid);

            return (
              <div
                key={p.id}
                className="bg-white p-6 rounded-xl shadow-lg border"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={
                      "rounded-full p-0.5 " +
                      (p.isOnline
                        ? "ring-2 ring-green-500"
                        : "ring-2 ring-gray-300")
                    }
                  >
                    <img
                      src={
                        p.imageUrl ||
                        "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                      }
                      alt={p.name || "Player"}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold">
                      {p.name || "Player"}
                    </h3>
                    <p className="text-gray-600">
                      {p.sport ||
                        (p.sports && p.sports.join(", ")) ||
                        "-"}
                    </p>
                    {(p.playerAge || p.gender) && (
                      <p className="text-sm text-gray-500">
                        {p.playerAge && `${p.playerAge} yrs`}
                        {p.playerAge && p.gender && " • "}
                        {p.gender && p.gender}
                      </p>
                    )}
                    {renderStars(p.rating || 0)}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    {p.distanceKm != null ? (
                      <p className="text-green-600 font-medium">
                        {p.distanceKm.toFixed(1)} km away
                      </p>
                    ) : (
                      <p className="text-gray-500">
                        Location not available
                      </p>
                    )}
                  </div>

                  <button
                    className={
                      "px-3 py-2 rounded text-white " +
                      (isAccepted
                        ? "bg-green-600 hover:bg-green-700"
                        : isRequested
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700")
                    }
                    disabled={isRequested && !isAccepted}
                    onClick={() => {
                      if (isAccepted) {
                        startChat(targetUid);
                      } else if (!isRequested) {
                        sendChatRequest(targetUid, p.name, p.sport);
                      }
                    }}
                  >
                    {isAccepted
                      ? "Chat"
                      : isRequested
                      ? "Requested"
                      : "Send Request"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
