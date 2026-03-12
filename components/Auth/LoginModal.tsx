'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { signInWithGoogle } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (!auth || !db) {
                setError('Authentication service is currently unavailable');
                return;
            }

            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Initialize user document in Firestore on signup
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);

                if (!userSnap.exists()) {
                    await setDoc(userRef, {
                        email: user.email,
                        generationCount: 0,
                        credits: 100, // Tracking field for records as requested
                        createdAt: new Date().toISOString()
                    });
                }
            }
            onClose();
        } catch (err: any) {
            console.error('Auth error:', err);
            setError(err.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError(null);
        setIsLoading(true);
        try {
            await signInWithGoogle();
            onClose();
        } catch (err: any) {
            console.error('Google Auth error:', err);
            setError(err.message || 'Google authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <React.Fragment>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-[#1A1814]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-[#E5E2DC]"
                        >
                            <div className="p-6 md:p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight text-[#1A1814] font-display">
                                            {isLogin ? 'Welcome Back' : 'Create Account'}
                                        </h2>
                                        <p className="text-sm text-[#8C857B] mt-1">
                                            {isLogin ? 'Sign in to access your Studio Nomad workspace' : 'Join Studio Nomad to generate architectural renders'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-1.5 hover:bg-[#F5F2ED] rounded-xl transition-colors text-[#8C857B]"
                                    >
                                        <span className="material-symbols-outlined text-xl">close</span>
                                    </button>
                                </div>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#4A4540] uppercase tracking-wider mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-3 bg-[#F5F2ED] border border-[#E5E2DC] rounded-xl text-[#1A1814] focus:outline-none focus:border-[#C4A46D] focus:ring-1 focus:ring-[#C4A46D] transition-all"
                                            placeholder="arch@studio.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#4A4540] uppercase tracking-wider mb-2">
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-3 bg-[#F5F2ED] border border-[#E5E2DC] rounded-xl text-[#1A1814] focus:outline-none focus:border-[#C4A46D] focus:ring-1 focus:ring-[#C4A46D] transition-all"
                                            placeholder="••••••••"
                                            minLength={6}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-3.5 mt-2 bg-[#C4A46D] hover:bg-[#B3935C] text-white rounded-xl font-bold tracking-wide transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                                    >
                                        {isLoading ? (
                                            <span className="material-symbols-outlined animate-spin">refresh</span>
                                        ) : (
                                            isLogin ? 'Sign In' : 'Create Account'
                                        )}
                                    </button>
                                </form>

                                <div className="mt-6 relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-[#E5E2DC]"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-white px-2 text-[#8C857B]">Or continue with</span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleGoogleSignIn}
                                    disabled={isLoading}
                                    className="w-full mt-6 py-3 px-4 bg-white hover:bg-[#F5F2ED] border border-[#E5E2DC] rounded-xl text-[#1A1814] font-medium transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            fill="currentColor"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            style={{ fill: '#4285F4' }}
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            style={{ fill: '#34A853' }}
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            style={{ fill: '#FBBC05' }}
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            style={{ fill: '#EA4335' }}
                                        />
                                    </svg>
                                    Google
                                </button>

                                <div className="mt-6 text-center">
                                    <button
                                        type="button"
                                        onClick={() => { setIsLogin(!isLogin); setError(null); }}
                                        className="text-sm font-medium text-[#8C857B] hover:text-[#C4A46D] transition-colors"
                                    >
                                        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </React.Fragment>
            )}
        </AnimatePresence>
    );
}
