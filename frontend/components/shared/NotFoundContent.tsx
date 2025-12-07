"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/landing/sections/Navbar';

export default function NotFoundContent() {
  const [isSpanish, setIsSpanish] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setIsSpanish(navigator.language.startsWith('es'));
    }
  }, []);

  // Configuración de las columnas (alturas relativas en %)
  // Diseño simétrico en V
  const columns = [
    80, 65, 50, 35, 20, // Izquierda
    0, 0, 0, 0, 0, 0,   // Centro (espacio para contenido)
    20, 35, 50, 65, 80  // Derecha
  ];

  if (!mounted) {
    return null; // Avoid hydration mismatch by rendering nothing on server/initial client
  }

  return (
    <div className="min-h-screen w-full bg-white flex flex-col relative overflow-hidden font-sans text-zinc-900">
      <Navbar />

      {/* Contenido Central */}
      <main className="flex-grow flex flex-col items-center justify-center z-20 px-4 text-center mt-[-10vh]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tight text-zinc-900">
            Error 404
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 mb-10 max-w-lg mx-auto leading-relaxed font-medium">
            {isSpanish
              ? 'Parece que has tomado un camino equivocado. Esta página no existe, tal vez se movió o nunca existió.'
              : 'Looks like you took a wrong turn. This page doesn\'t exist, maybe it moved, or maybe it never did.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/"
              className="px-8 py-3 rounded-full bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 min-w-[160px]"
            >
              {isSpanish ? 'Volver al inicio' : 'Go back home'}
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3 rounded-full border-2 border-zinc-200 text-zinc-700 font-medium hover:border-zinc-300 hover:bg-zinc-50 transition-all min-w-[160px]"
            >
              {isSpanish ? 'Contáctanos' : 'Contact us'}
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Columnas de fondo */}
      <div className="absolute bottom-0 left-0 w-full h-full flex items-end justify-center pointer-events-none z-0">
        {columns.map((height, index) => (
          <motion.div
            key={index}
            className="flex-1 relative"
            style={{
              height: `${height}%`,
              background: `linear-gradient(180deg, var(--mentha) 0%, #10b981 100%)`, // Gradiente de Mentha a Emerald
              opacity: height > 0 ? 1 : 0
            }}
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{
              duration: 1.2,
              delay: index * 0.05,
              ease: [0.22, 1, 0.36, 1]
            }}
          >
            {/* Efecto de grano/ruido para textura */}
            <div
              className="absolute inset-0 opacity-30 mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              }}
            />
            {/* Brillo superior */}
            <div className="absolute top-0 left-0 right-0 h-px bg-white/30" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
