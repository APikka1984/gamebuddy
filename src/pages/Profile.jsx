// src/pages/Profile.jsx - ✅ FULLY FIXED TIMESTAMP CRASH
import { useEffect, useState } from "react";
import { auth, db, storage, database } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { ref as dbRef, onValue, onDisconnect, set as realtimeSet } from "firebase/database";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, logoutUser, updateSport } from "../redux/userSlice";
import { useToast } from "../components/ToastManager";

export default function Profile() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userState = useSelector((state) => state.user);
  const addToast = useToast();

  const [sport, setSport] = useState(userState.sport || "");
  const [age, setAge] = useState("");
  const [rating, setRating] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [gender, setGender] = useState("");
  const [userData, setUserData] = useState(null);
  const [savingLocation, setSavingLocation] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("update");

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setCheckingAuth(false);
      if (!user) {
        dispatch(logoutUser());
        navigate("/login", { replace: true });
      }
    });
    return () => unsub();
  }, [dispatch, navigate]);

  // Load profile data
  useEffect(() => {
    const fetchUser = async () => {
      if (!authUser) return;
      try {
        const refDoc = doc(db, "players", authUser.uid);
        const snap = await getDoc(refDoc);
        if (snap.exists()) {
          const data = snap.data();
          setUserData(data);
          setSport(data.sport || "");
          setAge(data.age ? String(data.age) : "");
          setRating(
            typeof data.rating === "number" ? String(data.rating) : ""
          );
          setNameInput(data.name || authUser.displayName || "");
          setGender(data.gender || "");
          dispatch(
            loginUser({
              uid: authUser.uid,
              name: data.name ?? authUser.displayName,
              email: data.email ?? authUser.email,
              photoURL: data.imageUrl ?? authUser.photoURL,
              sport: data.sport ?? null,
              age: data.age ?? null,
              latitude: data.latitude ?? null,
              longitude: data.longitude ?? null,
              isProfileComplete: Boolean(
                data.sport && data.latitude && data.longitude
              ),
            })
          );
        } else {
          setNameInput(authUser.displayName || "");
        }
      } catch (err) {
        console.error("fetchUser error:", err);
      }
    };
    fetchUser();
  }, [authUser, dispatch]);

  // 🔥 AUTOMATIC ONLINE PRESENCE (SERVER TIMESTAMPS FIXED)
  useEffect(() => {
    if (!authUser?.uid) return;

    const connectedRef = dbRef(database, `.info/connected`);
    const userPresenceRef = dbRef(database, `presence/${authUser.uid}`);

    const connectedUnsub = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        realtimeSet(userPresenceRef, {
          isOnline: true,
          lastSeenAt: serverTimestamp(),
          timestamp: serverTimestamp()
        });
        onDisconnect(userPresenceRef).set({
          isOnline: false,
          lastSeenAt: serverTimestamp(),
          timestamp: serverTimestamp()
        });
      }
    });

    const presenceUnsub = onValue(userPresenceRef, async (snap) => {
      const presence = snap.val();
      if (presence) {
        await setDoc(doc(db, "players", authUser.uid), {
          isOnline: presence.isOnline,
          lastSeenAt: presence.lastSeenAt,
        }, { merge: true });
        
        setUserData(prev => ({ 
          ...prev, 
          isOnline: presence.isOnline,
          lastSeenAt: presence.lastSeenAt 
        }));
      }
    });

    return () => {
      connectedUnsub();
      presenceUnsub();
    };
  }, [authUser]);

  if (checkingAuth || !authUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  const saveProfile = async () => {
    if (!nameInput.trim() || !age || Number(age) < 13 || !gender || !sport) {
      addToast("Please fill all required fields", "error");
      return;
    }
    try {
      await setDoc(
        doc(db, "players", authUser.uid),
        {
          uid: authUser.uid,
          name: nameInput.trim(),
          gender,
          sport,
          age: Number(age),
          rating: rating ? Number(rating) : 0,
        },
        { merge: true }
      );
      dispatch(updateSport(sport));
      addToast("Profile updated! 🎉");
    } catch (err) {
      console.error(err);
      addToast("Failed to save profile", "error");
    }
  };

  const updateProfileImage = async (e) => {
    const file = e.target.files[0];
    if (!file || file.size > 2 * 1024 * 1024) {
      addToast("Please choose an image smaller than 2MB.", "error");
      return;
    }
    setUploadingImage(true);
    try {
      const storageReference = storageRef(
        storage,
        `profileImages/${authUser.uid}/${file.name}`
      );
      await uploadBytes(storageReference, file);
      const url = await getDownloadURL(storageReference);
      await setDoc(
        doc(db, "players", authUser.uid),
        { imageUrl: url },
        { merge: true }
      );
      setUserData((prev) => ({ ...(prev || {}), imageUrl: url }));
      dispatch(loginUser({ ...userState, photoURL: url }));
      addToast("Profile image updated! 📸");
    } catch (error) {
      console.error("Image upload error:", error);
      addToast("Image update failed!", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const saveLocation = () => {
    if (!navigator.geolocation) {
      addToast("Geolocation not supported.", "error");
      return;
    }
    setSavingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const latitude = Number(coords.latitude.toFixed(4));
          const longitude = Number(coords.longitude.toFixed(4));
          await setDoc(
            doc(db, "players", authUser.uid),
            { latitude, longitude },
            { merge: true }
          );
          setUserData((prev) => ({ ...(prev || {}), latitude, longitude }));
          dispatch(
            loginUser({
              ...userState,
              latitude,
              longitude,
              isProfileComplete: Boolean(sport && latitude && longitude),
            })
          );
          addToast("Location saved! 📍");
        } catch (err) {
          console.error(err);
          addToast("Failed to save location.", "error");
        } finally {
          setSavingLocation(false);
        }
      },
      () => {
        addToast("Enable location access and try again!", "error");
        setSavingLocation(false);
      }
    );
  };

  const handleLogout = async () => {
    if (authUser?.uid) {
      const userPresenceRef = dbRef(database, `presence/${authUser.uid}`);
      await realtimeSet(userPresenceRef, {
        isOnline: false,
        lastSeenAt: serverTimestamp(),
        timestamp: serverTimestamp()
      });
    }
    await signOut(auth);
    dispatch(logoutUser());
    navigate("/login");
  };

  const displayName =
    userData?.name ||
    nameInput ||
    userState.name ||
    authUser.displayName ||
    "User";
  const displayEmail =
    userData?.email || userState.email || authUser.email;
  const displaySport =
    sport || userData?.sport || userState.sport || "Select a sport";
  const displayPhoto =
    userData?.imageUrl ||
    userState.photoURL ||
    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
  const safeRating = Number(rating) || 0;
  const isOnline = userData?.isOnline || false;
  
  // ✅ FIXED: SAFE TIMESTAMP HANDLING (RTDB number + Firestore Timestamp)
  const lastSeenDate = userData?.lastSeenAt 
    ? (() => {
        const timestamp = userData.lastSeenAt;
        if (timestamp && typeof timestamp === 'object' && typeof timestamp.toDate === 'function') {
          return timestamp.toDate();  // Firestore Timestamp
        } else if (typeof timestamp === 'number') {
          return new Date(timestamp);  // RTDB number (epoch ms)
        }
        return null;
      })()
    : null;

  return (
    <div className="flex h-screen bg-gray-100 pt-16">
      {/* Profile Card */}
      <div className="w-64 bg-white shadow-lg p-6 flex flex-col items-center">
        <div className="relative">
          <div
            className={`rounded-full p-1 transition-all ${
              isOnline ? "ring-4 ring-green-500" : "ring-2 ring-gray-300"
            }`}
          >
            <img
              src={displayPhoto}
              alt="profile"
              className="w-28 h-28 rounded-full object-cover"
            />
          </div>
          <label
            htmlFor="fileUpload"
            className="absolute bottom-0 right-0 bg-blue-600 text-white text-xs px-2 py-1 rounded-full cursor-pointer shadow-md translate-y-1/2"
          >
            {uploadingImage ? "..." : "Edit"}
          </label>
          <input
            id="fileUpload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={updateProfileImage}
            disabled={uploadingImage}
          />
        </div>
        <h2 className="text-lg font-bold mt-3">{displayName}</h2>
        <p className="text-gray-500 text-sm">{displayEmail}</p>
        <p className="text-blue-500 mt-1">{displaySport}</p>
        {age && <p className="text-sm text-gray-600">{age} years</p>}
        {gender && (
          <p className="text-sm text-gray-600 capitalize">{gender}</p>
        )}
        <p className="text-sm text-yellow-500 mt-1">
          Rating: {safeRating.toFixed(1)}/5
        </p>
        {lastSeenDate && (
          <p className="text-xs text-gray-500 mt-1">
            Last seen {lastSeenDate.toLocaleString()}
          </p>
        )}
        <button
          onClick={handleLogout}
          className="mt-6 w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-8">
        <div className="flex items-center justify-between mt-6 mb-4">
          <h1 className="text-3xl font-bold text-blue-600">Profile</h1>
          <div className="flex gap-3">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                activeTab === "update"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setActiveTab("update")}
            >
              Update Profile
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                activeTab === "chats"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setActiveTab("chats")}
            >
              Chats
            </button>
          </div>
        </div>

        {activeTab === "update" ? (
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Your full name"
                className="w-64 p-3 border rounded-lg"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <select
                className="w-64 p-3 border rounded-lg"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">-- Select gender --</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age *
              </label>
              <input
                type="number"
                min="13"
                max="100"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter your age"
                className="w-64 p-3 border rounded-lg"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your skill rating (0–5)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.5"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-64 p-3 border rounded-lg"
              />
            </div>
            <select
              className="w-64 p-3 border rounded-lg mb-3"
              value={sport}
              onChange={(e) => setSport(e.target.value)}
            >
              <option value="">-- Select Sport --</option>
              <option value="cricket">Cricket 🏏</option>
              <option value="football">Football ⚽</option>
              <option value="badminton">Badminton 🏸</option>
              <option value="tennis">Tennis 🎾</option>
              <option value="chess">Chess ♟️</option>
            </select>
            <button
              className="bg-green-600 text-white py-2 px-8 rounded-lg hover:bg-green-700 mb-4"
              onClick={saveProfile}
            >
              Save Profile
            </button>
            <button
              className="bg-purple-600 text-white py-2 px-6 rounded-lg hover:bg-purple-700 disabled:opacity-60"
              onClick={saveLocation}
              disabled={savingLocation}
            >
              {savingLocation ? "Saving..." : "Save My Location 📍"}
            </button>
            <p className="text-sm text-gray-500 mt-3">
              Used only to find players near you.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center mt-8">
            <p className="mb-3 text-gray-700">
              Open your chats to talk with players.
            </p>
            <Link
              to="/chats"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold"
            >
              Go to Chats
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
