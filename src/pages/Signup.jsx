// src/pages/Signup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { signInWithGoogle, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { loginUser } from "../redux/userSlice";

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
    <div className="h-screen flex justify-center items-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-xl max-w-sm w-full">
        <h2 className="text-2xl font-bold text-blue-600 text-center mb-6">
          Signup
        </h2>

        <button
          className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 active:scale-95 disabled:opacity-60"
          onClick={handleGoogleSignup}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        <p className="text-center mt-3 text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-blue-600 font-semibold hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
