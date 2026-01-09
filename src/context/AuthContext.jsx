import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    let role = 'user';

                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        role = data.role || 'user';
                    } else if (user.email.toLowerCase() === 'cnsb233@gmail.com') {
                        role = 'admin';
                    }

                    setCurrentUser({ ...user, role });
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    // Fallback for admin if firestore fails but email matches
                    let role = 'user';
                    if (user.email?.toLowerCase() === 'cnsb233@gmail.com') {
                        role = 'admin';
                    }
                    setCurrentUser({ ...user, role });
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
