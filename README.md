# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
# GameBuddy – Find Nearby Sports Players

Live: https://gamezone-311a2.web.app

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


### `chats` collection



Where `chatId = [uid1, uid2].sort().join("_")`.

### `messages` subcollection


This follows a common Firestore chat pattern (room doc + messages subcollection).[web:113][web:121]

## Core Flows

### Auth & Protection

- `AuthGate` listens to Firebase Auth and syncs Redux with the current user.[web:130]
- `ProtectedRoute` in `App.jsx` checks `user.uid` and redirects unauthenticated users to `/login`.

### Profile

- `Profile.jsx` loads `players/{uid}`, allows editing fields, and saves to Firestore.[web:130]
- Sets `isOnline: true` on profile save and `isOnline: false` on logout for a simple presence system.[web:113][web:121]
- Uploads profile images to Firebase Storage and stores the URL in Firestore.
- Captures geolocation and stores lat/lng for distance matching.

### Find Players

- `FindPlayers.jsx` loads all players (optionally filtered by sport) and the current user’s location.[web:167]
- Computes distance using the Haversine formula and applies filters (distance, age).
- Renders cards with an online ring based on `isOnline`, plus sport, age, gender, and rating.
- Clicking “Chat”:
  - Computes a stable `chatId` from the two UIDs.
  - Upserts `chats/{chatId}` with participants and timestamps.
  - Navigates to `/chat/:chatId`.

### Chat

- `Chat.jsx` reads `chatId` from the URL, derives the other user’s UID, and loads their profile.[web:130]
- Listens in real time to `chats/{chatId}/messages` ordered by `createdAt`.
- Displays messages left/right based on sender.
- Sends new messages with `serverTimestamp` and updates `lastMessageAt`/`lastMessageText` in `chats/{chatId}`.

### Chats List

- `ChatsList.jsx` queries `chats` where `participants` contains the current UID, ordered by `lastMessageAt`.[web:130]
- For each chat, loads the other player’s profile and shows avatar, name, last message, and time.
- Clicking a chat navigates back to `/chat/:chatId`.

## Getting Started



Vite will start the app on a local development URL.[web:172]

## Environment Variables

Create a `.env` or `.env.local` file:


`src/firebase.js` should read these and initialize Firebase using `initializeApp`, `getAuth`, `getFirestore`, and `getStorage`.[web:130]

## Future Improvements

- Real-time presence using Firebase Realtime Database presence API (instead of manual `isOnline` field).[web:113][web:121]
- Push notifications for new chat messages (Firebase Cloud Messaging).[web:130]
- Group sessions (e.g., “Need 2 players for football at 7 PM”).
- More advanced matching (skill level, preferred time, multiple sports).
