'use client'

import React from 'react'
import { Navbar as Header } from "@/components/landing";
import FooterSection from "@/components/landing/footer-section";
import { Building2, Mail, FileText, Scale } from 'lucide-react'

export default function AvisoLegalPage() {
    // IMPORTANT: Replace these with actual company data
    const companyInfo = {
        name: '[NOMBRE DE LA EMPRESA]',
        tradeName: 'Mentha',
        cif: '[CIF/NIF]',
        address: '[DIRECCIÓN COMPLETA]',
        city: '[CIUDAD, CÓDIGO POSTAL]',
        country: 'España',
        email: 'legal@mentha.ai',
        phone: '[TELÉFONO]',
        registryInfo: '[Datos del Registro Mercantil si aplica]',
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white selection:bg-emerald-500/30 transition-colors">
            <Header />
            <main className="pt-32 pb-24">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white flex items-center gap-3">
                        <Scale className="w-10 h-10 text-emerald-500" />
                        Aviso Legal
                    </h1>

                    <div className="prose prose-gray dark:prose-invert max-w-none">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Última actualización: {new Date().toLocaleDateString('es-ES')}
                        </p>

                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 mb-8">
                            <p className="text-amber-800 dark:text-amber-200 text-sm">
                                <strong>⚠️ Nota:</strong> Este documento contiene campos de ejemplo que deben ser completados con la información real de la empresa antes del lanzamiento a producción.
                            </p>
                        </div>

                        <div className="space-y-8">
                            {/* Titular del sitio web */}
                            <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-emerald-500" />
                                    1. Datos Identificativos del Titular
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y Comercio Electrónico (LSSI-CE), se informa:
                                </p>
                                <div className="bg-gray-50 dark:bg-zinc-800/50 rounded-lg p-4 space-y-2 text-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Denominación social:</span>
                                            <p className="font-medium text-gray-900 dark:text-white">{companyInfo.name}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Nombre comercial:</span>
                                            <p className="font-medium text-gray-900 dark:text-white">{companyInfo.tradeName}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">CIF/NIF:</span>
                                            <p className="font-medium text-gray-900 dark:text-white">{companyInfo.cif}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Domicilio social:</span>
                                            <p className="font-medium text-gray-900 dark:text-white">{companyInfo.address}, {companyInfo.city}, {companyInfo.country}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Email de contacto:</span>
                                            <p className="font-medium text-gray-900 dark:text-white">{companyInfo.email}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-gray-400">Inscripción registral:</span>
                                            <p className="font-medium text-gray-900 dark:text-white">{companyInfo.registryInfo}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Objeto y ámbito de aplicación */}
                            <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-emerald-500" />
                                    2. Objeto y Ámbito de Aplicación
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    El presente Aviso Legal regula el uso del sitio web <strong>mentha.ai</strong> (en adelante, el "Sitio Web"), del que es titular {companyInfo.tradeName}.
                                </p>
                                <p className="text-gray-600 dark:text-gray-300">
                                    El acceso al Sitio Web es gratuito salvo en lo relativo al coste de la conexión a través de la red de telecomunicaciones suministrada por el proveedor de acceso contratado por los usuarios. La utilización del Sitio Web atribuye la condición de usuario (en adelante, el "Usuario") e implica la aceptación de todas las condiciones incluidas en este Aviso Legal.
                                </p>
                            </section>

                            {/* Propiedad Intelectual */}
                            <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                                    3. Propiedad Intelectual e Industrial
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    Todos los contenidos del Sitio Web, incluyendo sin limitación: textos, gráficos, imágenes, su diseño y los derechos de propiedad intelectual que pudieran corresponder a dichos contenidos, así como todas las marcas, nombres comerciales o cualquier otro signo distintivo, son propiedad de {companyInfo.tradeName} o de terceros, sin que pueda entenderse cedidos al Usuario ninguno de los derechos de explotación reconocidos por la normativa vigente.
                                </p>
                                <p className="text-gray-600 dark:text-gray-300">
                                    El Usuario se compromete a no reproducir, copiar, distribuir, poner a disposición, comunicar públicamente, transformar o modificar los contenidos salvo en los casos autorizados en la ley o expresamente consentidos por {companyInfo.tradeName} o por quien ostente la titularidad de los derechos de explotación.
                                </p>
                            </section>

                            {/* Responsabilidad */}
                            <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                                    4. Exclusión de Responsabilidad
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    {companyInfo.tradeName} no se hace responsable, en ningún caso, de los daños y perjuicios de cualquier naturaleza que pudieran ocasionar, a título enunciativo:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                                    <li>Errores u omisiones en los contenidos.</li>
                                    <li>Falta de disponibilidad del Sitio Web.</li>
                                    <li>Transmisión de virus o programas maliciosos en los contenidos.</li>
                                    <li>Uso ilícito o contrario al presente Aviso Legal.</li>
                                    <li>Falta de veracidad, exactitud, exhaustividad y/o actualidad de los contenidos.</li>
                                </ul>
                            </section>

                            {/* Uso de la plataforma - Específico de Mentha */}
                            <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                                    5. Condiciones de Uso Específicas de Mentha
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    Mentha es una plataforma de análisis de visibilidad en motores de búsqueda y motores generativos (AEO/GEO). El Usuario reconoce y acepta que:
                                </p>
                                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                                    <li>El servicio utiliza tecnologías de extracción de datos (web scraping) de fuentes públicas de internet.</li>
                                    <li>Los resultados proporcionados son orientativos y no constituyen asesoramiento profesional.</li>
                                    <li>El Usuario es el único responsable de verificar que el uso del servicio cumple con las condiciones de uso de terceros sitios web.</li>
                                    <li>Los datos de análisis pueden ser procesados por proveedores externos de inteligencia artificial (como OpenAI) ubicados fuera del Espacio Económico Europeo.</li>
                                </ul>
                            </section>

                            {/* Legislación aplicable */}
                            <section className="bg-white dark:bg-zinc-900/50 rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-sm dark:shadow-none">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                                    6. Legislación Aplicable y Jurisdicción
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Las presentes condiciones se rigen y se interpretarán de acuerdo con la legislación española. Para la resolución de cualquier controversia que pudiera surgir, las partes se someten a los Juzgados y Tribunales del domicilio del Usuario, si este tiene la consideración de consumidor, o en su defecto, a los Juzgados y Tribunales de {companyInfo.city}.
                                </p>
                            </section>

                            {/* Contacto */}
                            <section className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 p-6">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-emerald-500" />
                                    Contacto
                                </h2>
                                <p className="text-gray-600 dark:text-gray-300">
                                    Para cualquier consulta relacionada con este Aviso Legal, puede contactarnos en: <a href={`mailto:${companyInfo.email}`} className="text-emerald-600 dark:text-emerald-400 hover:underline">{companyInfo.email}</a>
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
            <FooterSection />
        </div>
    )
}
