// likeUser function
/*import { doc, setDoc, getDoc, collection } from "firebase/firestore";

async function likeUser(targetUid) {
  const me = auth.currentUser.uid;
  // record my like
  await setDoc(doc(db, "swipes", me, "likes", targetUid), { uid: targetUid, ts: new Date() });

  // check if target also liked me
  const otherLikeDoc = await getDoc(doc(db, "swipes", targetUid, "likes", me));
  if (otherLikeDoc.exists()) {
    // create match
    const matchId = [me, targetUid].sort().join("_");
    await setDoc(doc(db, "matches", matchId), { users: [me, targetUid], createdAt: new Date() });
    // notify both users or navigate to chat
  }
}*/
