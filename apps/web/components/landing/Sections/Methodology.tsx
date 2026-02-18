import React from 'react';

const Methodology: React.FC = () => {
  const steps = [
    {
      id: "01",
      name: "Semantic Dissection",
      desc: "We break down your brand into entities and attributes understandable by vector models."
    },
    {
      id: "02",
      name: "Context Injection",
      desc: "We create layers of context in authoritative sources that LLMs already trust (Wikis, Papers)."
    },
    {
      id: "03",
      name: "Prompt Engineering",
      desc: "We simulate thousands of queries to adjust how the AI associates your product with user intent."
    },
    {
      id: "04",
      name: "Feedback Loop",
      desc: "Constant monitoring of hallucinations and readjustment of content strategy."
    }
  ];

  return (
    <section className="border-b border-mentha-forest dark:border-mentha-beige py-24 px-6 md:px-12">
       <div className="mb-16 flex flex-col md:flex-row justify-between items-end">
          <h2 className="font-serif text-5xl md:text-6xl max-w-2xl">
            The <span className="italic text-mentha-mint">Mentha</span> Protocol.
          </h2>
          <p className="font-mono text-xs uppercase tracking-widest mt-6 md:mt-0">
            [ SYSTEM ARCHITECTURE ]
          </p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-mentha-forest dark:border-mentha-beige">
          {steps.map((step) => (
            <div key={step.id} className="group border-r border-b border-mentha-forest dark:border-mentha-beige p-8 flex flex-col justify-between h-64 hover:bg-current hover:bg-opacity-[0.03] transition-colors duration-300">
               <div className="flex justify-between w-full">
                  <span className="font-mono text-xl">{step.id}</span>
                  <div className="h-2 w-2 bg-mentha-mint rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
               </div>
               
               <div>
                 <h3 className="font-serif text-2xl mb-4 group-hover:text-mentha-mint transition-colors duration-300">{step.name}</h3>
                 <p className="font-sans text-sm opacity-70 leading-relaxed">
                   {step.desc}
                 </p>
               </div>
            </div>
          ))}
       </div>
    </section>
  );
};

export default Methodology;
