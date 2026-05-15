import type React from 'react';

import { useTranslations } from '@/lib/i18n';

const Services: React.FC = () => {
    const { t } = useTranslations();

    const services = [
        {
            title: t.service1Title,
            desc: t.service1Desc,
            metric: t.service1Metric,
            id: '01',
        },
        {
            title: t.service2Title,
            desc: t.service2Desc,
            metric: t.service2Metric,
            id: '02',
        },
        {
            title: t.service3Title,
            desc: t.service3Desc,
            metric: t.service3Metric,
            id: '03',
        },
    ];

    const barHeights = [45, 80, 60, 30, 90, 50, 75, 40, 65, 85, 25, 55];

    return (
        <section id="services" className="border-b border-mentha-forest dark:border-mentha-beige">
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-current">
                {services.map((service, serviceIndex) => (
                    <div
                        key={service.id}
                        className="group p-12 flex flex-col h-full transition-colors duration-300"
                    >
                        <div className="flex justify-between items-start mb-12">
                            <span className="font-mono text-sm border border-mentha-forest dark:border-mentha-beige px-2 py-1 rounded-none">
                                {service.id}
                            </span>
                            <span className="font-mono text-[10px] tracking-widest uppercase opacity-70">
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
                            <div className="w-full h-32 border border-mentha-forest dark:border-mentha-beige border-opacity-30 p-2 flex items-end gap-x-1">
                                {Array.from({ length: 12 }, (_, barIndex) => ({
                                    key: `${service.id}-bar-${barIndex}`,
                                    height: barHeights[
                                        (serviceIndex * 12 + barIndex) % barHeights.length
                                    ],
                                })).map((bar) => (
                                    <div
                                        key={bar.key}
                                        className="flex-1 bg-current opacity-20 group-hover:bg-mentha-mint transition-all duration-500"
                                        style={{
                                            height: `${bar.height}%`,
                                        }}
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
