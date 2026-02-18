import React from 'react';

const Services: React.FC = () => {
  const services = [
    {
      title: "LLM Brand Mapping",
      desc: "We audit how you are perceived by GPT-4, Claude 3.5, and Gemini. We identify hallucinations and negative biases in real-time.",
      metric: "SENTIMENT ANALYSIS",
      id: "01"
    },
    {
      title: "RAG Readiness",
      desc: "We restructure your data (JSON-LD, Knowledge Graphs) to be easily ingested by Retrieval-Augmented Generation systems.",
      metric: "DATA STRUCTURE",
      id: "02"
    },
    {
      title: "Citation Optimization",
      desc: "We insert your brand into authority sources (Whitepapers, News, Wikis) that models use to substantiate their answers.",
      metric: "AUTHORITY SCORE",
      id: "03"
    }
  ];

  const barHeights = [45, 80, 60, 30, 90, 50, 75, 40, 65, 85, 25, 55];

  return (
    <section id="services" className="border-b border-mentha-forest dark:border-mentha-beige">
      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-current">
        {services.map((service, serviceIndex) => (
          <div key={service.id} className="group p-12 flex flex-col h-full transition-colors duration-300">
            <div className="flex justify-between items-start mb-12">
              <span className="font-mono text-sm border border-mentha-forest dark:border-mentha-beige px-2 py-1 rounded-none">
                {service.id}
              </span>
              <span className="font-mono text-[10px] tracking-widest uppercase opacity-60">
                {service.metric}
              </span>
            </div>
            
            <div className="mt-auto">
              <h3 className="font-serif text-3xl mb-4 group-hover:text-mentha-mint transition-colors">
                {service.title}
              </h3>
              <p className="font-sans text-base opacity-80 leading-relaxed mb-8">
                {service.desc}
              </p>
              
              {/* Abstract Viz Placeholder */}
              <div className="w-full h-32 border border-mentha-forest dark:border-mentha-beige border-opacity-30 p-2 flex items-end space-x-1">
                 {Array.from({ length: 12 }).map((_, i) => (
                    <div 
                        key={i} 
                        className="flex-1 bg-current opacity-20 group-hover:bg-mentha-mint transition-all duration-500"
                        style={{ height: `${barHeights[(serviceIndex * 12 + i) % barHeights.length]}%` }}
                    ></div>
                 ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Services;
