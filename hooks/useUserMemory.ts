import { useState, useEffect } from 'react';
import { doc, onSnapshot, collection, addDoc, increment, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
    email: string;
    generationCount: number;
    credits: number;
    createdAt: string;
}

export const useUserMemory = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    useEffect(() => {
        if (!user || !db) {
            setProfile(null);
            setIsLoadingProfile(false);
            return;
        }

        const userRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(
            userRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    setProfile(docSnap.data() as UserProfile);
                } else {
                    // Initialize mock profile for first-time users if they exist in Auth but not Firestore
                    setProfile({
                        email: user.email || '',
                        generationCount: 0,
                        credits: 100,
                        createdAt: new Date().toISOString()
                    });
                }
                setIsLoadingProfile(false);
            },
            (error) => {
                console.warn('Firestore fallback: Using mock profile due to connection error.', error);
                // Provide a default mock profile if Firestore is offline
                setProfile({
                    email: user.email || '',
                    generationCount: 0,
                    credits: 100,
                    createdAt: new Date().toISOString()
                });
                setIsLoadingProfile(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const logGeneration = async (prompt: string, settings: any, resultUrl: string) => {
        if (!user) throw new Error('Must be logged in to log generation.');
        if (!db) throw new Error('Database service is unavailable.');

        try {
            // 1. Log the generation event to the subcollection
            const generationsRef = collection(db, 'users', user.uid, 'generations');
            await addDoc(generationsRef, {
                prompt,
                settings,
                resultUrl,
                timestamp: serverTimestamp(),
            }).catch(e => console.warn('Non-critical: Failed to log generation to Firestore', e));

            // 2. Increment the generationCount locally and try to update Firestore
            setProfile(prev => prev ? { ...prev, generationCount: prev.generationCount + 1 } : null);
            
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                generationCount: increment(1),
            }).catch(e => console.warn('Non-critical: Failed to update generationCount in Firestore', e));

        } catch (error) {
            console.warn('Logging error (handled):', error);
            // We don't throw here to ensure the user still gets their render even if logging fails
        }
    };

    return { profile, isLoadingProfile, logGeneration };
};
