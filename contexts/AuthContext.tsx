'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    logout: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    logout: async () => { },
    signInWithGoogle: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            setIsLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Sync user to Firestore - Non-blocking to improve UI responsiveness
            syncUserParams(user).catch(err => 
                console.warn('Auth Sync Warning: Background sync failed', err)
            );
        } catch (error) {
            console.error('Error signing in with Google:', error);
            throw error;
        }
    };

    const syncUserParams = async (user: User) => {
        try {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    generationCount: 0,
                    credits: 100,
                    createdAt: new Date().toISOString()
                });
            }
        } catch (firestoreError) {
            console.error('Firestore Sync Error:', firestoreError);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, logout, signInWithGoogle }}>
            {children}
        </AuthContext.Provider>
    );
}
