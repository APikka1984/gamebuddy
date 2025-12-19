// src/pages/Login.jsx
import { useState } from "react";
import { db, signInWithGoogle } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { loginUser } from "../redux/userSlice";
import { GiLightningShield } from "react-icons/gi";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const setBasicUser = (uid, basicInfo = {}) => {
    dispatch(
      loginUser({
        uid,
        ...basicInfo,
        name: basicInfo.name || "User",
        email: basicInfo.email || null,
        photoURL: basicInfo.photoURL || null,
        sport: null,
        latitude: null,
        longitude: null,
        isProfileComplete: false,
      })
    );
  };

  const hydrateUserFromFirestore = async (uid) => {
    try {
      const ref = doc(db, "players", uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        dispatch(
          loginUser({
            uid,
            name: data.name ?? "User",
            email: data.email ?? null,
            photoURL: data.imageUrl ?? null,
            sport: data.sport ?? null,
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null,
            isProfileComplete: Boolean(
              data.sport && data.latitude && data.longitude
            ),
          })
        );
      }
    } catch (err) {
      console.warn("Firestore unavailable, using basic user:", err.message);
    }
  };

  const googleLoginHandler = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      const user = result.user;

      setBasicUser(user.uid, {
        email: user.email,
        name: user.displayName || user.email?.split("@")[0] || "",
        photoURL: user.photoURL,
      });

      hydrateUserFromFirestore(user.uid).catch(console.warn);

      navigate("/profile");
    } catch (error) {
      console.error("Google login error:", error);
      alert("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050816] text-white flex items-center justify-center px-4 pt-20 pb-10">
      {/* background glows */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.28),_transparent_60%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(34,197,94,0.22),_transparent_55%)]" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-white/5 border border-white/10 rounded-2xl shadow-2xl shadow-hero-blue/30 backdrop-blur-xl px-5 py-6 sm:px-6 sm:py-7">
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#020617] border border-white/15 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-hero-green/80">
              <GiLightningShield className="text-hero-yellow text-base" />
              <span>GameBuddy</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-hero-yellow via-hero-green to-hero-blue bg-clip-text text-transparent">
              Login
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 text-center">
              Sign in to assemble your squad and jump into nearby games.
            </p>
          </div>

          <p className="text-center text-xs sm:text-sm text-gray-300 mb-4">
            New to GameBuddy?{" "}
            <Link
              to="/signup"
              className="text-hero-yellow hover:underline font-semibold"
            >
              Signup
            </Link>
          </p>

          <button
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 sm:py-3 rounded-full font-semibold text-sm sm:text-base shadow-lg shadow-red-600/40 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={googleLoginHandler}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Continue with Google"}
          </button>
        </div>
      </div>
    </div>
  );
}
