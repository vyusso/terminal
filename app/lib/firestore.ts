import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// Collection names
const USERS_COLLECTION = "users";
const ACTIVE_COMMENTS_COLLECTION = "active_comments";

/**
 * Save user nickname to Firestore
 * @param nickname - User's nickname
 * @param deviceId - Unique device identifier (IP + User Agent)
 */
export const saveUserNickname = async (nickname: string, deviceId: string) => {
  try {
    // Create a user document with device ID as identifier
    const userRef = doc(db, USERS_COLLECTION, deviceId);

    await setDoc(userRef, {
      nickname,
      deviceId,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      isActive: true,
    });

    console.log("User nickname saved to Firestore:", nickname);
    return { success: true };
  } catch (error) {
    console.error("Error saving user nickname:", error);
    return { success: false, error };
  }
};

/**
 * Get user data by device ID
 * @param deviceId - Unique device identifier
 */
export const getUserByIP = async (deviceId: string) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, deviceId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, data: null };
    }
  } catch (error) {
    console.error("Error getting user by IP:", error);
    return { success: false, error };
  }
};

/**
 * Check if a nickname already exists in the database
 * @param nickname - The nickname to check
 * @returns true if nickname exists, false otherwise
 */
export const checkNicknameExists = async (
  nickname: string
): Promise<boolean> => {
  try {
    const nicknameQuery = query(
      collection(db, USERS_COLLECTION),
      where("nickname", "==", nickname)
    );

    const querySnapshot = await getDocs(nicknameQuery);
    return !querySnapshot.empty; // Returns true if nickname exists
  } catch (error) {
    console.error("Error checking nickname existence:", error);
    return false; // Assume nickname doesn't exist if there's an error
  }
};

/**
 * Upsert an active comment for a given nickname
 * Ensures a single document per nickname (subsequent saves edit the same entry)
 */
export const upsertActiveComment = async (
  nickname: string,
  content: string
) => {
  try {
    const docRef = doc(db, ACTIVE_COMMENTS_COLLECTION, nickname);
    await setDoc(
      docRef,
      { nickname, content, updatedAt: serverTimestamp() },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    console.error("Error upserting active comment:", error);
    return { success: false, error };
  }
};

/**
 * Get a single active comment by nickname
 */
export const getActiveComment = async (nickname: string) => {
  try {
    const ref = doc(db, ACTIVE_COMMENTS_COLLECTION, nickname);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { success: true, data: null };
    return {
      success: true,
      data: snap.data() as { nickname: string; content: string },
    };
  } catch (error) {
    console.error("Error getting active comment:", error);
    return { success: false, error };
  }
};

/**
 * List all active comments (shared directory view)
 */
export const getAllActiveComments = async () => {
  try {
    const snap = await getDocs(collection(db, ACTIVE_COMMENTS_COLLECTION));
    const items = snap.docs.map(
      (d) => d.data() as { nickname: string; content: string }
    );
    return { success: true, data: items };
  } catch (error) {
    console.error("Error listing active comments:", error);
    return { success: false, error };
  }
};
