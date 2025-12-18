// src/pages/Login.jsx
import { useState } from "react";
import { db, signInWithGoogle } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { loginUser } from "../redux/userSlice";

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
    <div className="h-screen flex justify-center items-center bg-gray-100 px-4 pt-20">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">
          Login
        </h2>

        <p className="text-center text-gray-600 mb-4">
          New to GameBuddy?{" "}
          <Link
            to="/signup"
            className="text-blue-600 hover:underline font-semibold"
          >
            Signup
          </Link>
        </p>

        <button
          className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
          onClick={googleLoginHandler}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}
