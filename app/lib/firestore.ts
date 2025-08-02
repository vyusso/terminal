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

/**
 * Save user nickname to Firestore
 * @param nickname - User's nickname
 * @param ipAddress - User's IP address (for tracking)
 */
export const saveUserNickname = async (nickname: string, ipAddress: string) => {
  try {
    // Create a user document with IP as identifier
    const userRef = doc(db, USERS_COLLECTION, ipAddress);

    await setDoc(userRef, {
      nickname,
      ipAddress,
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
 * Get user data by IP address
 * @param ipAddress - User's IP address
 */
export const getUserByIP = async (ipAddress: string) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, ipAddress);
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
