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
        if (!user) {
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
                    setProfile(null);
                }
                setIsLoadingProfile(false);
            },
            (error) => {
                console.error('Error fetching user profile:', error);
                setIsLoadingProfile(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const logGeneration = async (prompt: string, settings: any, resultUrl: string) => {
        if (!user) throw new Error('Must be logged in to log generation.');

        try {
            // 1. Log the generation event to the subcollection
            const generationsRef = collection(db, 'users', user.uid, 'generations');
            await addDoc(generationsRef, {
                prompt,
                settings,
                resultUrl,
                timestamp: serverTimestamp(),
            });

            // 2. Increment the generationCount
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                generationCount: increment(1),
            });

        } catch (error) {
            console.error('Error logging generation:', error);
            throw error;
        }
    };

    return { profile, isLoadingProfile, logGeneration };
};
