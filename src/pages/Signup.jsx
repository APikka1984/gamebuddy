// src/pages/Signup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { signInWithGoogle, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { loginUser } from "../redux/userSlice";
import { GiLightningShield } from "react-icons/gi";

export default function Signup() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      const user = result.user;

      // Create/update player profile
      await setDoc(
        doc(db, "players", user.uid),
        {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split("@")[0] || "",
          sport: "",
        },
        { merge: true }
      );

      // Put user in Redux
      dispatch(
        loginUser({
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email?.split("@")[0] || "",
          photoURL: user.photoURL,
        })
      );

      alert("Signed up with Google");
      navigate("/profile");
    } catch (err) {
      console.error("Google signup error:", err);
      alert("Google signup failed. Please try again.");
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
              Signup
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 text-center">
              Create your hero profile and start finding players near you.
            </p>
          </div>

          <button
            className="w-full bg-red-600 text-white py-2.5 sm:py-3 rounded-full hover:bg-red-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed font-semibold text-sm sm:text-base shadow-lg shadow-red-600/40"
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Continue with Google"}
          </button>

          <p className="text-center mt-3 text-xs sm:text-sm text-gray-300">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-hero-yellow font-semibold hover:underline"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
