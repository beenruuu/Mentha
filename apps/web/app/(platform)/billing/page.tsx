'use client';

import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, Clock, Coins, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';

import { fetchFromApi } from '@/lib/api';

export default function BillingPage() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [topUpAmount, setTopUpAmount] = useState(500);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const data = await fetchFromApi('/billing/transactions');
            setTransactions(data.data || []);
        } catch (err) {
            console.error('Failed to fetch transactions', err);
        } finally {
            setLoading(false);
        }
    };

    const handleTopUp = async () => {
        if (!confirm(`Are you sure you want to add ${topUpAmount} credits to your account?`))
            return;

        try {
            await fetchFromApi('/billing/top-up', {
                method: 'POST',
                body: JSON.stringify({
                    amount: topUpAmount,
                    description: 'Balance Recharge (Dashboard)',
                }),
            });
            alert('Credits added successfully!');
            fetchTransactions();
            // Trigger refresh of header credits
            window.location.reload();
        } catch (err) {
            alert('Failed to add credits');
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="mb-12">
                <h1 className="text-4xl font-serif text-mentha-forest dark:text-mentha-beige mb-2">
                    Billing & Credits
                </h1>
                <p className="font-mono text-xs uppercase tracking-widest text-mentha-forest/60 dark:text-mentha-beige/60">
                    Manage your AEO computation resources
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Top-up Card */}
                <div className="lg:col-span-1 bg-mentha-dark text-mentha-beige p-8 rounded-3xl shadow-xl flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-mentha-mint/20 rounded-2xl flex items-center justify-center mb-6">
                            <Coins className="text-mentha-mint" size={24} />
                        </div>
                        <h2 className="text-2xl font-serif mb-2">Add Credits</h2>
                        <p className="font-sans text-sm opacity-60 mb-8">
                            Purchase more power for your GEO scans and brand analysis.
                        </p>

                        <div className="space-y-4">
                            {[500, 1000, 5000].map((amount) => (
                                <button
                                    key={amount}
                                    onClick={() => setTopUpAmount(amount)}
                                    className={`w-full p-4 rounded-xl border text-sm font-mono flex justify-between items-center transition-all ${topUpAmount === amount ? 'border-mentha-mint bg-mentha-mint/10 text-mentha-mint' : 'border-white/10 hover:border-white/30'}`}
                                >
                                    <span>{amount.toLocaleString()} CREDITS</span>
                                    <span className="opacity-60">${(amount / 100).toFixed(2)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleTopUp}
                        className="mt-8 w-full bg-mentha-mint text-mentha-dark py-4 rounded-xl font-mono text-sm font-bold uppercase tracking-widest hover:bg-mentha-mint/90 transition-all flex items-center justify-center gap-2"
                    >
                        <CreditCard size={18} />
                        Buy Credits
                    </button>
                </div>

                {/* Transactions History */}
                <div className="lg:col-span-2 bg-white dark:bg-black/20 border border-mentha-forest/10 dark:border-mentha-beige/10 rounded-3xl p-8">
                    <h3 className="text-xl font-serif mb-6 flex items-center gap-2">
                        <Clock size={20} className="text-mentha-mint" />
                        Usage History
                    </h3>

                    {loading ? (
                        <div className="flex flex-col gap-4">
                            {[...Array(5)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-16 w-full bg-mentha-forest/5 animate-pulse rounded-xl"
                                ></div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {transactions.length === 0 ? (
                                <p className="text-center py-12 text-mentha-forest/40 dark:text-mentha-beige/40 font-mono text-xs uppercase italic">
                                    No transactions recorded yet
                                </p>
                            ) : (
                                transactions.map((tx: any) => (
                                    <div
                                        key={tx.id}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-mentha-forest/5 dark:bg-white/5 border border-transparent hover:border-mentha-mint/20 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
                                            >
                                                {tx.amount > 0 ? (
                                                    <ArrowUpRight size={18} />
                                                ) : (
                                                    <ArrowDownLeft size={18} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-sans font-semibold">
                                                    {tx.description}
                                                </p>
                                                <p className="text-[10px] font-mono uppercase opacity-40">
                                                    {format(
                                                        new Date(tx.created_at),
                                                        'MMM dd, yyyy HH:mm',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div
                                            className={`font-mono font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-mentha-forest dark:text-mentha-beige'}`}
                                        >
                                            {tx.amount > 0 ? '+' : ''}
                                            {tx.amount.toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
