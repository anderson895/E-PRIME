import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import type { UserAccount, UserRole } from "@/types";

/**
 * Sign in with email + password, then verify role from Firestore
 */
export async function loginUser(
  email: string,
  password: string,
  role: UserRole
): Promise<UserAccount> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, "users", credential.user.uid));

  if (!userDoc.exists()) {
    await signOut(auth);
    throw new Error("User account not found. Contact your administrator.");
  }

  const userData = userDoc.data() as UserAccount;

  if (userData.role !== role) {
    await signOut(auth);
    throw new Error(`Role mismatch. Your account is registered as "${userData.role}".`);
  }

  if (!userData.isActive) {
    await signOut(auth);
    throw new Error("Your account has been deactivated. Contact your administrator.");
  }

  // Update last login
  await updateDoc(doc(db, "users", credential.user.uid), {
    lastLogin: new Date().toISOString(),
  });

  return { ...userData, uid: credential.user.uid };
}

/**
 * Register a new user account (admin only)
 */
export async function registerUser(
  email: string,
  password: string,
  displayName: string,
  role: UserRole,
  contactNumber?: string
): Promise<UserAccount> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);

  await updateProfile(credential.user, { displayName });

  const userAccount: UserAccount = {
    uid: credential.user.uid,
    email,
    displayName,
    role,
    contactNumber: contactNumber || "",
    photoURL: "",
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, "users", credential.user.uid), userAccount);
  return userAccount;
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Send password reset email via Firebase (or Nodemailer if configured)
 */
export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Get current user profile from Firestore
 */
export async function getUserProfile(uid: string): Promise<UserAccount | null> {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists()) return null;
  return { ...userDoc.data(), uid } as UserAccount;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<UserAccount>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), { ...data });
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
