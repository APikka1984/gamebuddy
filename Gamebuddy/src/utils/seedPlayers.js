import { db } from "../firebase";
import { collection, setDoc, doc } from "firebase/firestore";

const samplePlayers = [
  // Football players
  { name: "Rohit Sharma", sport: "football", email: "rohit@example.com" },
  { name: "Amit Singh", sport: "football", email: "amit@example.com" },

  // Cricket players
  { name: "Virat Kohli", sport: "cricket", email: "virat@example.com" },
  { name: "Dhoni Kumar", sport: "cricket", email: "dhoni@example.com" },

  // Badminton players
  { name: "Saina Nehwal", sport: "badminton", email: "saina@example.com" },
  { name: "Anu Jain", sport: "badminton", email: "anu@example.com" },

  // Chess players
  { name: "Pranav Mehta", sport: "chess", email: "pranav@example.com" },
  { name: "Kiran Rao", sport: "chess", email: "kiran@example.com" }
];

export const seedPlayers = async () => {
  try {
    for (let player of samplePlayers) {
      // create unique document id
      const id = player.name.toLowerCase().replace(/\s+/g, "_");
      await setDoc(doc(collection(db, "players"), id), {
        ...player,
        uid: id,
      });
    }

    console.log("Players successfully added to Firestore!");
  } catch (error) {
    console.error("Error seeding players:", error);
  }
};
