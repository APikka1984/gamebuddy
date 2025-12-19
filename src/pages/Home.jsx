// src/pages/Home.jsx
import { useNavigate } from "react-router-dom";
import {
  FaFootballBall,
  FaBasketballBall,
  FaChessKnight,
  FaVolleyballBall,
  FaGlobeAmericas,
} from "react-icons/fa";
import { MdSportsCricket } from "react-icons/md";
import { GiTennisRacket } from "react-icons/gi";

export default function Home() {
  const navigate = useNavigate();

  const sports = [
    { name: "Football", slug: "football", icon: <FaFootballBall /> },
    { name: "Cricket", slug: "cricket", icon: <MdSportsCricket /> },
    { name: "Badminton", slug: "badminton", icon: <GiTennisRacket /> },
    { name: "Chess", slug: "chess", icon: <FaChessKnight /> },
    { name: "Basketball", slug: "basketball", icon: <FaBasketballBall /> },
    { name: "Volleyball", slug: "volleyball", icon: <FaVolleyballBall /> },
  ];

  return (
    <div className="relative min-h-screen bg-[#050816] text-white px-4 sm:px-6 lg:px-10 pt-24 pb-16">
      {/* stadium glows */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.28),_transparent_60%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(34,197,94,0.22),_transparent_55%)]" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Simple hero header */}
        <div className="mb-8 sm:mb-10 text-center md:text-left px-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/15 px-3 py-1 text-[11px] sm:text-xs uppercase tracking-[0.2em] text-hero-green/80">
            <span className="h-2 w-2 rounded-full bg-hero-green" />
            <span>Play more. Play nearby.</span>
          </div>

          <h1 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-extrabold leading-snug">
            <span className="block bg-gradient-to-r from-hero-yellow via-hero-green to-hero-blue bg-clip-text text-transparent">
              Find players in your city.
            </span>
            <span className="block text-gray-200 text-sm sm:text-base mt-2 font-normal">
              Choose your sport and match with nearby players.
            </span>
          </h1>

          <div className="mt-4 flex justify-center md:justify-start">
            <button
              type="button"
              onClick={() => navigate("/players")}
              className="inline-flex items-center justify-center rounded-full bg-hero-blue hover:bg-blue-500 text-white px-5 py-2.5 text-sm sm:text-base font-semibold shadow-lg shadow-hero-blue/40"
            >
              Find players near me
            </button>
          </div>
        </div>

        {/* Sports grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
          {sports.map((sport) => (
            <div
              key={sport.slug}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/players/${sport.slug}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate(`/players/${sport.slug}`);
                }
              }}
              className="cursor-pointer group rounded-2xl bg-white/5 border border-white/10 shadow-lg shadow-hero-blue/20 backdrop-blur-md px-3 py-4 sm:p-5 flex flex-col items-center justify-center gap-2 sm:gap-3 hover:border-hero-yellow/80 hover:shadow-hero-yellow/30 hover:-translate-y-1 active:scale-95 transition"
            >
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#020617] border border-white/10 text-2xl sm:text-3xl text-hero-yellow group-hover:text-hero-green group-hover:border-hero-green/70 transition">
                {sport.icon}
              </div>
              <p className="mt-1 font-semibold text-xs sm:text-sm md:text-base text-center">
                {sport.name}
              </p>
            </div>
          ))}

          {/* All sports tile */}
          <div
            key="all-sports"
            role="button"
            tabIndex={0}
            onClick={() => navigate("/players")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                navigate("/players");
              }
            }}
            className="cursor-pointer rounded-2xl bg-gradient-to-br from-hero-blue/20 via-hero-green/20 to-hero-yellow/20 border border-hero-blue/50 shadow-lg shadow-hero-blue/30 px-3 py-4 sm:p-5 flex flex-col items-center justify-center gap-2 sm:gap-3 hover:border-hero-yellow hover:shadow-hero-yellow/40 hover:-translate-y-1 active:scale-95 transition"
          >
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#020617] border border-hero-yellow/70 text-2xl sm:text-3xl text-hero-yellow">
              <FaGlobeAmericas />
            </div>
            <p className="mt-1 font-semibold text-xs sm:text-sm md:text-base text-center text-hero-yellow">
              All sports near me
            </p>
            <p className="hidden sm:block text-[11px] text-gray-200 text-center">
              Show every player, every sport around you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
