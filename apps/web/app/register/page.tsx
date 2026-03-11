'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth-client';
import { Loader2 } from 'lucide-react';

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
            await signUp.email({ 
                name,
                email, 
                password,
                fetchOptions: {
                    onSuccess: () => {
                        router.push('/dashboard');
                    },
                    onError: (ctx) => {
                        setError(ctx.error.message || 'Registration failed');
                    }
                }
            });
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-mentha-beige dark:bg-mentha-dark overflow-hidden">
            {/* Left Column: Visual/Branding (Reversed for visual variety) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-mentha-forest overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-full h-full bg-[conic-gradient(from_0deg_at_50%_50%,#10b982_0%,transparent_100%)]"></div>
                    <div className="grid grid-cols-10 gap-4 opacity-20">
                         {[...Array(100)].map((_, i) => (
                             <div key={i} className="w-1 h-1 bg-mentha-mint rounded-full"></div>
                         ))}
                    </div>
                </div>
                
                <div className="relative z-10 text-center max-w-lg">
                    <h2 className="font-serif text-6xl text-mentha-beige mb-6">Build Authority.</h2>
                    <p className="font-mono text-sm text-mentha-mint uppercase tracking-widest mb-8">Establish your neural footprint</p>
                    <div className="h-1 w-24 bg-mentha-mint mx-auto mb-12"></div>
                    <p className="text-mentha-beige/70 font-sans text-lg leading-relaxed">
                        Join the platform that helps brands navigate the generative shift with data-driven GEO strategies.
                    </p>
                </div>
            </div>

            {/* Right Column: Register Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16">
                <div className="w-full max-w-md animate-in fade-in slide-in-from-left-8 duration-700">
                    <div className="mb-12">
                        <Link href="/" className="inline-block mb-8">
                            <span className="font-serif text-3xl text-mentha-forest dark:text-mentha-beige">Mentha<span className="text-mentha-mint">.</span></span>
                        </Link>
                        <h1 className="text-4xl font-serif text-mentha-forest dark:text-mentha-beige mb-2">Create Account.</h1>
                        <p className="text-mentha-forest/60 dark:text-mentha-beige/60 font-mono text-xs uppercase tracking-widest">Start your 14-day AEO Pro Trial</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-8 text-sm flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-mentha-forest/40 dark:text-mentha-beige/40 ml-1">Full Name</label>
                            <input 
                                type="text" 
                                required 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-transparent border-b border-mentha-forest/20 dark:border-mentha-beige/20 p-4 font-serif text-xl focus:outline-none focus:border-mentha-mint transition-colors text-mentha-forest dark:text-mentha-beige placeholder-mentha-forest/20 dark:placeholder-mentha-beige/20" 
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-mentha-forest/40 dark:text-mentha-beige/40 ml-1">Work Email</label>
                            <input 
                                type="email" 
                                required 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-transparent border-b border-mentha-forest/20 dark:border-mentha-beige/20 p-4 font-serif text-xl focus:outline-none focus:border-mentha-mint transition-colors text-mentha-forest dark:text-mentha-beige placeholder-mentha-forest/20 dark:placeholder-mentha-beige/20" 
                                placeholder="name@company.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-mono uppercase tracking-[0.2em] text-mentha-forest/40 dark:text-mentha-beige/40 ml-1">Password</label>
                            <input 
                                type="password" 
                                required 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-transparent border-b border-mentha-forest/20 dark:border-mentha-beige/20 p-4 font-serif text-xl focus:outline-none focus:border-mentha-mint transition-colors text-mentha-forest dark:text-mentha-beige placeholder-mentha-forest/20 dark:placeholder-mentha-beige/20" 
                                placeholder="••••••••"
                            />
                        </div>
                        
                        <div className="pt-6">
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full bg-mentha-mint text-mentha-dark py-5 rounded-none font-mono text-sm font-bold uppercase tracking-[0.2em] hover:bg-mentha-mint/90 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : null}
                                {loading ? 'CREATING ACCOUNT...' : 'REGISTER & START SCANNING'}
                            </button>
                        </div>
                    </form>

                    <p className="mt-12 text-center text-[10px] font-mono uppercase tracking-widest text-mentha-forest/40 dark:text-mentha-beige/40">
                        Already have an account? <Link href="/login" className="text-mentha-mint hover:text-mentha-mint/80 transition-colors border-b border-mentha-mint/30 pb-0.5 ml-2">Log in here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}