import type React from 'react';

const Footer: React.FC = () => {
    return (
        <footer
            id="footer"
            className="min-h-screen flex flex-col justify-between pt-24 pb-8 border-t border-mentha-mint dark:border-mentha-beige overflow-hidden"
        >
            <div className="px-8 md:px-16 grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-1 space-y-8">
                    <h4 className="font-mono text-xs uppercase tracking-widest mb-6">Newsletter</h4>
                    <p className="font-serif text-2xl italic mb-4">
                        Insights for the Generative Age.
                    </p>
                    <div className="flex border-b border-mentha-forest dark:border-mentha-beige pb-2">
                        <input
                            type="email"
                            placeholder="Email Address"
                            className="bg-transparent w-full focus:outline-none font-mono text-sm placeholder-current placeholder-opacity-40"
                        />
                        <button className="font-mono text-xs uppercase hover:text-mentha-mint">
                            SUBMIT
                        </button>
                    </div>
                </div>

                <div className="md:col-span-1 space-y-4">
                    <h4 className="font-mono text-xs uppercase tracking-widest mb-6">Sitemap</h4>
                    <ul className="space-y-2 font-serif text-xl">
                        <li>
                            <a href="#" className="hover:italic hover:pl-2 transition-all">
                                Home
                            </a>
                        </li>
                        <li>
                            <a href="#services" className="hover:italic hover:pl-2 transition-all">
                                Services
                            </a>
                        </li>
                        <li>
                            <a href="#shift" className="hover:italic hover:pl-2 transition-all">
                                The Shift
                            </a>
                        </li>
                        <li>
                            <a href="#audit" className="hover:italic hover:pl-2 transition-all">
                                Audit Tool
                            </a>
                        </li>
                    </ul>
                </div>

                <div className="md:col-span-1 space-y-4 md:text-right">
                    <h4 className="font-mono text-xs uppercase tracking-widest mb-6">Legal</h4>
                    <ul className="space-y-2 font-mono text-xs opacity-60">
                        <li>Privacy Policy</li>
                        <li>Terms of Service</li>
                        <li>© 2026 Mentha AEO Agency</li>
                    </ul>
                    <p className="font-mono text-[10px] mt-8">Designed by beenruuu</p>
                </div>
            </div>

            <div className="mt-auto pt-12 pb-20 relative">
                <h1 className="text-[18vw] leading-[0.8] font-serif tracking-tighter text-center w-full select-none pointer-events-none text-current opacity-10">
                    MENTHA
                </h1>
            </div>
        </footer>
    );
};

export default Footer;
