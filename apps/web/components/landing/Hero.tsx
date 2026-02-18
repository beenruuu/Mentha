'use client';

export function Hero() {
    return (
        <div className="relative bg-white dark:bg-mentha-dark pt-32 md:pt-40 flex flex-col items-center transition-colors duration-300">
            {/* Text Content */}
            <div className="max-w-4xl mx-auto text-center px-6 mb-8 relative z-10">
                <div className="mb-6 flex justify-center">
                    <span className="text-gray-500 font-medium text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1 rounded-full">
                        An Open-Source alternative to traditional SEO
                    </span>
                </div>

                <h1 className="text-4xl md:text-6xl font-light tracking-tight mb-6 text-current">
                    Fast, private, realtime <br />
                    <span className="">AEO analytics</span>
                </h1>

                <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-lg mx-auto leading-relaxed font-normal">
                    Understand your AI visibility and how engines engage with your brand in
                    realtime.
                </p>

                <div className="flex items-center justify-center gap-3">
                    <button className="bg-mentha-forest text-mentha-beige dark:bg-mentha-beige dark:text-mentha-forest px-6 py-3 rounded-full text-sm font-medium hover:bg-mentha-forest/90 transition-all active:scale-95 duration-300 shadow-sm">
                        Start 14 day free trial
                    </button>
                    <button className="bg-white dark:bg-transparent border border-gray-100 dark:border-white/10 text-mentha-forest dark:text-mentha-beige px-6 py-3 rounded-full text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95 duration-300">
                        See demo
                    </button>
                </div>
            </div>

            {/* Static Hero Image - Responsive & Full Screen Height */}
            <div className="w-full px-0 overflow-hidden">
                <div className="w-full h-screen relative">
                    <img
                        src="/pexels-codioful-7134995.jpg"
                        alt="Mentha AEO Intelligence Platform - Visualization of AI search results and semantic data analytics"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-mentha-dark/10 to-transparent pointer-events-none" />
                </div>
            </div>
        </div>
    );
}
