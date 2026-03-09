'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchFromApi } from '@/lib/api';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await fetchFromApi('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password })
            });

            if (data.token) {
                localStorage.setItem('mentha_token', data.token);
                localStorage.setItem('mentha_user', JSON.stringify(data.user));
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-mentha-beige dark:bg-mentha-dark p-4">
            <div className="w-full max-w-md bg-white dark:bg-black/20 p-8 rounded-2xl shadow-sm border border-mentha-forest/10">
                <div className="text-center mb-10">
                    <h1 className="font-serif text-4xl mb-2 text-mentha-forest dark:text-mentha-beige">Mentha.</h1>
                    <p className="font-mono text-xs uppercase tracking-widest opacity-60">Create Account</p>
                </div>
                
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-600 p-3 rounded mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                        <label className="block text-xs font-mono uppercase tracking-wider mb-2">Name</label>
                        <input 
                            type="text" 
                            required 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-3 rounded bg-transparent border border-mentha-forest/20 focus:border-mentha-mint outline-none" 
                            placeholder="John Doe"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-mono uppercase tracking-wider mb-2">Email</label>
                        <input 
                            type="email" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 rounded bg-transparent border border-mentha-forest/20 focus:border-mentha-mint outline-none" 
                            placeholder="name@company.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-mono uppercase tracking-wider mb-2">Password</label>
                        <input 
                            type="password" 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 rounded bg-transparent border border-mentha-forest/20 focus:border-mentha-mint outline-none" 
                            placeholder="••••••••"
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-mentha-mint text-mentha-dark py-3 rounded font-mono text-sm uppercase tracking-widest hover:bg-mentha-mint/90 transition-colors disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Creating account...' : 'Register'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm opacity-70">
                    Already have an account? <Link href="/login" className="text-mentha-mint hover:underline">Log in</Link>
                </p>
            </div>
        </div>
    );
}