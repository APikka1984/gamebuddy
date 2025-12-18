import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const sports = [
    { name: "Football", icon: "⚽", slug: "football" },
    { name: "Cricket", icon: "🏏", slug: "cricket" },
    { name: "Badminton", icon: "🏸", slug: "badminton" },
    { name: "Chess", icon: "♟️", slug: "chess" },
    { name: "Basketball", icon: "🏀", slug: "basketball" },
    { name: "Volleyball", icon: "🏐", slug: "volleyball" },
  ];

  return (
    <div className="px-8 pt-24 min-h-screen bg-gray-100">
      <h2 className="text-4xl font-bold text-center mb-10 text-blue-600">
        Choose a Sport 🎯
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {sports.map((sport) => (
          <div
            key={sport.name}
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/players/${sport.slug}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                navigate(`/players/${sport.slug}`);
              }
            }}
            className="cursor-pointer bg-white shadow-lg p-6 rounded-xl flex flex-col items-center hover:scale-[1.05] active:scale-[.95] transition"
          >
            <span className="text-5xl">{sport.icon}</span>
            <p className="mt-4 font-semibold text-lg">{sport.name}</p>
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
          className="cursor-pointer bg-blue-50 border border-dashed border-blue-400 shadow-lg p-6 rounded-xl flex flex-col items-center hover:scale-[1.05] active:scale-[.95] transition"
        >
          <span className="text-4xl">🌍</span>
          <p className="mt-4 font-semibold text-lg text-blue-700">
            All sports near me
          </p>
        </div>
      </div>
    </div>
  );
}
