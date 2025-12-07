# GameBuddy – Find Nearby Sports Players

GameBuddy is a web app that helps players find nearby sports partners, see who is online, and chat 1:1 to coordinate games. It is built with React (Vite), Tailwind CSS, Firebase (Auth, Firestore, Storage), and Redux Toolkit.[web:166][web:167]

## Features

- Email/Google authentication (Firebase Auth).[web:130]
- Player profile with avatar, name, age, gender, primary sport, and self‑rating.
- Geolocation-based distance matching between players (Haversine formula).
- Online/offline indicator with green/gray avatar ring based on `isOnline`.
- Filterable player list (sport, distance, age range).
- 1:1 chat between players with persistent history in Firestore.
- Chats list page showing all conversations and last message previews.

## Tech Stack

- **Frontend:** React + Vite, JSX, React Router, Tailwind CSS.[web:171][web:172]
- **State Management:** Redux Toolkit (user slice).
- **Backend-as-a-Service:**
  - Firebase Authentication
  - Cloud Firestore (players, chats, messages)
  - Firebase Storage (profile images).[web:130]
- **Build Tool:** Vite dev server and bundler.[web:172]

## Project Structure (Key Files)

- `src/App.jsx` – App shell and routing (public + protected routes).
- `src/components/Navbar.jsx` – Top navigation bar.
- `src/components/AuthGate.jsx` – Waits for Firebase auth state before rendering.
- `src/redux/userSlice.js` – Redux user state (uid, profile, location, flags).
- `src/firebase.js` – Firebase initialization (Auth, Firestore, Storage).
- `src/pages/Home.jsx` – Landing page.
- `src/pages/Login.jsx` – Login screen.
- `src/pages/Signup.jsx` – Signup screen.
- `src/pages/Profile.jsx` – Profile editing, online status, link to chats.
- `src/pages/FindPlayers.jsx` – Player discovery, filters, “Chat” start.
- `src/pages/Chat.jsx` – Single chat room (real‑time messages).
- `src/pages/ChatsList.jsx` – List of user’s conversations.

## Data Model

### `players` collection

