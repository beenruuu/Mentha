import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-mentha-beige dark:bg-mentha-dark p-6 text-center">
            <div className="relative mb-8">
                <span className="font-serif text-[12rem] leading-none opacity-5 text-mentha-forest dark:text-mentha-beige select-none">404</span>
                <div className="absolute inset-0 flex items-center justify-center">
                    <h1 className="font-serif text-4xl md:text-5xl text-mentha-forest dark:text-mentha-beige">Lost in the Shift.</h1>
                </div>
            </div>
            
            <div className="max-w-md space-y-6">
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-mentha-mint">Neural path not found</p>
                <p className="font-sans text-lg opacity-60 leading-relaxed">
                    The intelligence you are looking for has either evolved, migrated, or never existed in this dimension.
                </p>
                
                <div className="pt-8">
                    <Link 
                        href="/dashboard" 
                        className="inline-block bg-mentha-mint text-mentha-dark px-10 py-4 font-mono text-xs font-bold uppercase tracking-widest hover:bg-mentha-mint/90 transition-all rounded-full"
                    >
                        Back to Intelligence Center
                    </Link>
                </div>
            </div>

            {/* Decorative element */}
            <div className="fixed bottom-0 left-0 w-full h-1/3 pointer-events-none overflow-hidden opacity-20">
                <div className="absolute -bottom-24 -left-24 w-96 h-96 border border-mentha-mint rounded-full"></div>
                <div className="absolute -bottom-48 -right-48 w-[32rem] h-[32rem] border border-mentha-mint/30 rounded-full animate-pulse"></div>
            </div>
        </div>
    );
}