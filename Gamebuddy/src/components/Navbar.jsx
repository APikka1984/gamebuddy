import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";

export default function Navbar() {
  const user = useSelector((state) => state.user);
  const isLoggedIn = Boolean(user?.uid);

  const baseLink = "hover:opacity-75 transition-colors duration-150";
  const getClass = ({ isActive }) =>
    `${baseLink} ${isActive ? "font-semibold underline" : ""}`;

  return (
    <nav className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center shadow-md fixed top-0 w-full z-50">
      <h1 className="font-bold text-xl tracking-wide">GameBuddy</h1>

      <div className="flex gap-6">
        <NavLink to="/" className={getClass}>
          Find Players
        </NavLink>

        {!isLoggedIn && (
          <>
            <NavLink to="/login" className={getClass}>
              Login
            </NavLink>
            <NavLink to="/signup" className={getClass}>
              Signup
            </NavLink>
          </>
        )}

        {isLoggedIn && (
          <>
            <NavLink to="/profile" className={getClass}>
              Profile
            </NavLink>
            <NavLink to="/chats" className={getClass}>
              Chats
            </NavLink>
            <NavLink to="/requests" className={getClass}>
              Requests
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
