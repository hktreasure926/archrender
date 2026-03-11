'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
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
