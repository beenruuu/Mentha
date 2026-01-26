import Link from "next/link";

export default function Home() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Mentha SaaS Platform</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Welcome to the cloud version of Mentha.</p>
            <Link href="/dashboard" className="btn-primary" style={{ textDecoration: 'none', padding: '12px 24px', background: 'var(--blue)', color: 'white', borderRadius: '8px', fontWeight: 'bold' }}>
                Go to Dashboard
            </Link>
        </div>
    );
}
