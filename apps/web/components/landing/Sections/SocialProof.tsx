
import React from 'react';

const SocialProof: React.FC = () => {
  return (
    <section id="cases" className="border-b border-mentha-forest dark:border-mentha-beige p-12 md:p-24">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
                 <h2 className="font-serif text-6xl md:text-8xl leading-none text-mentha-mint">
                    +340%
                </h2>
                <p className="font-mono text-sm mt-4 uppercase tracking-widest border-t border-mentha-forest dark:border-mentha-beige pt-4 inline-block">
                    Increase in Brand Mentions on Perplexity
                </p>
            </div>
            <div>
                 <h2 className="font-serif text-6xl md:text-8xl leading-none opacity-20">
                    2.5M
                </h2>
                <p className="font-mono text-sm mt-4 uppercase tracking-widest border-t border-mentha-forest dark:border-mentha-beige pt-4 inline-block opacity-60">
                    Generated Organic Impressions via LLMs
                </p>
            </div>
        </div>

        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-12 opacity-50 grayscale mix-blend-multiply dark:mix-blend-screen">
             {/* Abstract Placeholders for Logos to maintain "Wireframe" aesthetic */}
             {['FINTECH_CORP', 'LUXURY_EST', 'SAAS_GLOBAL', 'FUTURE_MEDIA'].map((logo, i) => (
                 <div key={i} className="h-12 border border-mentha-forest dark:border-mentha-beige flex items-center justify-center font-mono text-xs tracking-widest">
                     [ {logo} ]
                 </div>
             ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
