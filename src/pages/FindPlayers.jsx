// src/pages/FindPlayers.jsx - STYLED (stadium + superhero theme)
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
import {
  FaBasketballBall,
  FaFootballBall,
  FaTableTennis,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { GiSoccerKick, GiTennisRacket, GiLightningShield } from "react-icons/gi";
import { MdSportsCricket } from "react-icons/md";

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
          auth.currentUser.displayName || auth.currentUser.email || "Player",
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
      <div className="flex items-center gap-1 text-hero-yellow text-sm">
        <span>{"★".repeat(full) + "☆".repeat(empty)}</span>
        <span className="text-xs text-gray-400 ml-1">{r.toFixed(1)}/5</span>
      </div>
    );
  };

  const sportIcon = (name) => {
    const s = (name || "").toLowerCase();
    if (s.includes("football") || s.includes("soccer")) return <GiSoccerKick />;
    if (s.includes("basket")) return <FaBasketballBall />;
    if (s.includes("cricket")) return <MdSportsCricket />;
    if (s.includes("tennis") || s.includes("badminton"))
      return <GiTennisRacket />;
    if (s.includes("table")) return <FaTableTennis />;
    return <FaFootballBall />;
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
    <div className="relative min-h-screen bg-[#050816] text-white px-4 sm:px-6 lg:px-10 pt-28 pb-14">
      {/* Stadium / hero glows */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.25),_transparent_60%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(34,197,94,0.22),_transparent_55%)]" />
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header + filters */}
        <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-hero-green/80">
              <GiLightningShield className="text-hero-yellow text-xl" />
              <span>Squad Finder</span>
            </div>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold leading-tight">
              <span className="bg-gradient-to-r from-hero-yellow via-hero-green to-hero-blue bg-clip-text text-transparent">
                {sport ? `${sport} heroes nearby` : "Assemble your squad"}
              </span>
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-300 max-w-xl">
              Filter by distance and age, then send a request to start a
              1:1 chat and lock in today&apos;s game.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-md shadow-lg shadow-hero-blue/20">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-gray-300">
                Distance
              </span>
              <select
                className="bg-[#020617] border border-white/15 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hero-blue/80"
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

            <div className="h-px sm:h-8 sm:w-px bg-white/10 sm:mx-1" />

            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-gray-300">
                Age band
              </span>
              <select
                className="bg-[#020617] border border-white/15 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-hero-blue/80"
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

        {/* Legend / icon row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300 mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-green-400" />
            <span>Online now</span>
          </div>
          <div className="flex items-center gap-2">
            <FaMapMarkerAlt className="text-hero-yellow" />
            <span>Sorted by distance</span>
          </div>
          <div className="flex items-center gap-2 text-lg text-hero-yellow/80">
            <FaBasketballBall />
            <GiSoccerKick />
            <MdSportsCricket />
            <GiTennisRacket />
            <FaTableTennis />
            <span className="text-xs text-gray-300 ml-1">
              Icons adapt to player sport
            </span>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="mt-10 flex justify-center">
            <p className="text-gray-300 text-sm">
              Scouting nearby players&hellip;
            </p>
          </div>
        ) : renderedPlayers.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-2 text-center">
            <p className="text-gray-300 text-sm">
              No players match your filters yet.
            </p>
            <p className="text-xs text-gray-400">
              Try widening the distance or age band to assemble a bigger squad.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {renderedPlayers.map((p) => {
              const targetUid = p.uid || p.id;
              const isRequested = pendingRequests.has(targetUid);
              const isAccepted = acceptedRequests.has(targetUid);

              return (
                <div
                  key={p.id}
                  className="group relative rounded-2xl bg-white/5 border border-white/10 shadow-lg shadow-hero-blue/20 backdrop-blur-md p-5 flex flex-col gap-4 hover:border-hero-yellow/70 hover:shadow-hero-yellow/30 hover:-translate-y-1 transition"
                >
                  {/* Sport pill + online badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-[#020617]/80 border border-white/15 px-3 py-1 text-xs text-gray-200">
                      <span className="text-hero-yellow text-lg">
                        {sportIcon(
                          p.sport ||
                            (p.sports && p.sports[0]) ||
                            "Sport"
                        )}
                      </span>
                      <span className="truncate max-w-[110px]">
                        {p.sport ||
                          (p.sports && p.sports.join(", ")) ||
                          "Any sport"}
                      </span>
                    </div>

                    <span
                      className={
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium " +
                        (p.isOnline
                          ? "bg-green-500/15 text-green-300 border border-green-400/60"
                          : "bg-gray-700/40 text-gray-300 border border-gray-500/50")
                      }
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {p.isOnline ? "Online" : "Offline"}
                    </span>
                  </div>

                  {/* Avatar + details */}
                  <div className="flex items-center gap-4">
                    <div
                      className={
                        "rounded-full p-[2px] " +
                        (p.isOnline
                          ? "bg-gradient-to-tr from-hero-green via-hero-blue to-hero-yellow"
                          : "bg-gray-600/60")
                      }
                    >
                      <img
                        src={
                          p.imageUrl ||
                          "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                        }
                        alt={p.name || "Player"}
                        className="w-14 h-14 rounded-full object-cover bg-[#020617]"
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold truncate">
                        {p.name || "Player"}
                      </h3>
                      {(p.playerAge || p.gender) && (
                        <p className="text-xs text-gray-300">
                          {p.playerAge && `${p.playerAge} yrs`}
                          {p.playerAge && p.gender && " • "}
                          {p.gender && p.gender}
                        </p>
                      )}
                      {renderStars(p.rating || 0)}
                    </div>
                  </div>

                  {/* Distance + CTA */}
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-sm">
                      <FaMapMarkerAlt className="text-hero-yellow" />
                      {p.distanceKm != null ? (
                        <span className="font-medium text-hero-green">
                          {p.distanceKm.toFixed(1)} km away
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">
                          Location not available
                        </span>
                      )}
                    </div>

                    <button
                      className={
                        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold uppercase tracking-wide " +
                        (isAccepted
                          ? "bg-hero-green text-black hover:bg-emerald-400"
                          : isRequested
                          ? "bg-gray-500/70 text-gray-200 cursor-not-allowed"
                          : "bg-hero-blue text-white hover:bg-blue-500") +
                        " transition"
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
                      {isAccepted ? (
                        <>
                          <GiLightningShield className="text-lg" />
                          <span>Chat</span>
                        </>
                      ) : isRequested ? (
                        <span>Requested</span>
                      ) : (
                        <>
                          <GiLightningShield className="text-lg" />
                          <span>Send request</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
