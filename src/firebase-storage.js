import { db, authReady } from "./firebaseConfig";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

const COLLECTION = "sk-roster";

export async function fbLoad(key) {
  try {
    await authReady;
    const snap = await getDoc(doc(db, COLLECTION, key));
    return snap.exists() ? snap.data().value : null;
  } catch (e) {
    console.error("Firebase load failed:", key, e);
    return null;
  }
}

export async function fbSave(key, data) {
  try {
    await authReady;
    await setDoc(doc(db, COLLECTION, key), { value: data, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.error("Firebase save failed:", key, e);
  }
}

export function fbListen(key, callback) {
  return onSnapshot(doc(db, COLLECTION, key), (snap) => {
    if (snap.exists()) {
      callback(snap.data().value);
    }
  });
}
