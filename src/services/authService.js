import { auth, db } from '../firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const loginWithGoogle = async () => {
    try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;

        // Check if user exists in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        let userProfile = {};

        if (!userDoc.exists()) {
            // Create new user profile if not exists
            userProfile = {
                name: user.displayName,
                email: user.email,
                phone: user.phoneNumber || '', // Google might provide phone
                role: 'user',
                createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, userProfile);
        } else {
            userProfile = userDoc.data();
        }

        return {
            success: true,
            user: { ...user, ...userProfile }
        };
    } catch (error) {
        return { success: false, message: error.message, code: error.code };
    }
};

export const login = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        // Fetch user role from Firestore
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const userDoc = await getDoc(userDocRef);

        let userData = {};

        if (userDoc.exists()) {
            userData = userDoc.data();
        } else {
            // Profile missing (e.g. database cleared)? Recreate it!
            userData = {
                name: userCredential.user.displayName || 'Admin User',
                email: userCredential.user.email,
                phone: '',
                role: userCredential.user.email === 'cnsb233@gmail.com' ? 'admin' : 'user',
                createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, userData);
        }

        return {
            success: true,
            user: { ...userCredential.user, ...userData }
        };
    } catch (error) {
        return { success: false, message: error.message, code: error.code };
    }
};

export const register = async (userData) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);

        // Store extra user details in Firestore
        const userProfile = {
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            role: userData.email === 'cnsb233@gmail.com' ? 'admin' : 'user',
            createdAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);

        return { success: true, user: { ...userCredential.user, ...userProfile } };
    } catch (error) {
        return { success: false, message: error.message, code: error.code };
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message, code: error.code };
    }
};

// With Firebase, state is managed asynchronously via AuthContext. 
// These sync helpers are less reliable but kept for compatibility where possible.
export const getCurrentUser = () => {
    return auth.currentUser;
};

export const isAuthenticated = () => {
    return !!auth.currentUser;
};
