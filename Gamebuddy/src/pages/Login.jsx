// src/pages/Login.jsx
import { useState } from "react";
import { auth, db, signInWithGoogle } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { loginUser } from "../redux/userSlice";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const mapError = (error) => {
    if (!error?.code) return "Login failed. Please try again.";
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "Incorrect email or password.";
      case "auth/user-not-found":
        return "No account found with this email.";
      default:
        return "Login failed. Please try again.";
    }
  };

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

  const emailLoginHandler = async () => {
    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      setBasicUser(user.uid, { email: user.email });
      hydrateUserFromFirestore(user.uid).catch(console.warn);

      navigate("/profile");
    } catch (error) {
      alert(mapError(error));
    } finally {
      setLoading(false);
    }
  };

  const googleLoginHandler = async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      const user = result.user;

      setBasicUser(user.uid, {
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
      });

      hydrateUserFromFirestore(user.uid).catch(console.warn);

      navigate("/profile");
    } catch (error) {
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

        <input
          type="email"
          className="w-full p-3 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60"
          onClick={emailLoginHandler}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-gray-600 mt-4">
          Not registered?{" "}
          <Link
            to="/signup"
            className="text-blue-600 hover:underline font-semibold"
          >
            Signup
          </Link>
        </p>

        <div className="flex items-center my-4">
          <hr className="flex-1" />
          <span className="px-2 text-gray-500">OR</span>
          <hr className="flex-1" />
        </div>

        <button
          className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60"
          onClick={googleLoginHandler}
          disabled={loading}
        >
          Continue with Google
        </button>
      </div>
    </div>
  );
}
