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
} from "firebase/firestore";
import { auth, db } from "@/config/firebase";
import { logger, translateFirebaseError } from "@/utils/logger";
import type { UserAccount, UserRole } from "@/types";

/**
 * Sign in with email + password, then verify role from Firestore.
 */
export async function loginUser(
  email: string,
  password: string,
  role: UserRole
): Promise<UserAccount> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);

    let userDoc;
    try {
      userDoc = await getDoc(doc(db, "users", credential.user.uid));
    } catch (firestoreErr) {
      // Firebase Auth succeeded but Firestore fetch failed — sign out to avoid
      // a half-authenticated state, then surface a clear error.
      await signOut(auth).catch(() => {});
      logger.error("authService.loginUser", firestoreErr, { uid: credential.user.uid });
      throw new Error("Failed to load account data. Please try again.");
    }

    if (!userDoc.exists()) {
      await signOut(auth).catch(() => {});
      logger.warn("authService.loginUser", "User doc missing in Firestore", {
        uid: credential.user.uid,
        email,
      });
      throw new Error("User account not found. Contact your administrator.");
    }

    const userData = userDoc.data() as UserAccount;

    if (userData.role !== role) {
      await signOut(auth).catch(() => {});
      logger.warn("authService.loginUser", "Role mismatch", {
        expected: role,
        actual: userData.role,
        uid: credential.user.uid,
      });
      throw new Error(`Role mismatch. Your account is registered as "${userData.role}".`);
    }

    if (!userData.isActive) {
      await signOut(auth).catch(() => {});
      logger.warn("authService.loginUser", "Deactivated account login attempt", {
        uid: credential.user.uid,
        email,
      });
      throw new Error("Your account has been deactivated. Contact your administrator.");
    }

    // Update last login timestamp — non-critical, don't block on failure
    updateDoc(doc(db, "users", credential.user.uid), {
      lastLogin: new Date().toISOString(),
    }).catch((err) =>
      logger.warn("authService.loginUser", "Failed to update lastLogin", { err })
    );

    logger.info("authService.loginUser", "Login successful", {
      uid: credential.user.uid,
      role,
    });

    return { ...userData, uid: credential.user.uid };
  } catch (err) {
    // Re-throw our own custom errors (already have friendly messages).
    if (err instanceof Error && !("code" in err)) throw err;
    const message = translateFirebaseError(err);
    logger.error("authService.loginUser", err, { email, role });
    throw new Error(message);
  }
}

/**
 * Register a new user account (admin only).
 */
export async function registerUser(
  email: string,
  password: string,
  displayName: string,
  role: UserRole,
  contactNumber?: string
): Promise<UserAccount> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(credential.user, { displayName }).catch((profileErr) => {
      logger.warn("authService.registerUser", "Failed to set displayName on profile", {
        uid: credential.user.uid,
        profileErr,
      });
    });

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

    logger.info("authService.registerUser", "New user registered", {
      uid: credential.user.uid,
      role,
    });

    return userAccount;
  } catch (err) {
    logger.error("authService.registerUser", err, { email, role });
    throw new Error(translateFirebaseError(err));
  }
}

/**
 * Sign out current user.
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
    logger.info("authService.logoutUser", "User signed out");
  } catch (err) {
    logger.error("authService.logoutUser", err);
    throw new Error("Failed to sign out. Please try again.");
  }
}

/**
 * Send password reset email via Firebase.
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
    logger.info("authService.resetPassword", "Password reset email sent", { email });
  } catch (err) {
    logger.error("authService.resetPassword", err, { email });
    throw new Error(translateFirebaseError(err));
  }
}

/**
 * Get current user profile from Firestore.
 */
export async function getUserProfile(uid: string): Promise<UserAccount | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (!userDoc.exists()) {
      logger.warn("authService.getUserProfile", "User profile not found", { uid });
      return null;
    }
    return { ...userDoc.data(), uid } as UserAccount;
  } catch (err) {
    logger.error("authService.getUserProfile", err, { uid });
    return null; // Caller handles null gracefully — don't crash the auth listener
  }
}

/**
 * Update user profile fields.
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<UserAccount>
): Promise<void> {
  try {
    await updateDoc(doc(db, "users", uid), { ...data });
    logger.info("authService.updateUserProfile", "Profile updated", { uid });
  } catch (err) {
    logger.error("authService.updateUserProfile", err, { uid });
    throw new Error(translateFirebaseError(err));
  }
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
