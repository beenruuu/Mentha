"use client"

import { useState } from "react"
import { ArrowLeft, Sparkles, Globe, Target, TrendingUp, Brain, Eye, Zap, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { MenuButton } from "@/components/menu-button"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CreateBrandPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Paso 1: Información Básica
    brandName: "",
    website: "",
    industry: "",
    description: "",
    
    // Paso 2: Objetivos de IA-Visibility
    targetAudience: "",
    keyTerms: "",
    competitors: "",
    
    // Paso 3: Contexto Estratégico
    uniqueValue: "",
    contentStrategy: "",
    aiGoals: [] as string[],
  })

  const totalSteps = 3

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = () => {
    // Aquí iría la lógica para crear la marca
    console.log("Creando marca:", formData)
    router.push("/dashboard")
  }

  const toggleGoal = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      aiGoals: prev.aiGoals.includes(goal)
        ? prev.aiGoals.filter(g => g !== goal)
        : [...prev.aiGoals, goal]
    }))
  }

  const aiGoalOptions = [
    { id: "visibility", label: "Aumentar visibilidad en respuestas IA", icon: Eye },
    { id: "mentions", label: "Generar más menciones en modelos", icon: Sparkles },
    { id: "authority", label: "Establecerse como autoridad en nicho", icon: Target },
    { id: "compete", label: "Competir con marcas establecidas", icon: TrendingUp },
    { id: "monitor", label: "Monitorear percepción de la IA", icon: Brain },
    { id: "optimize", label: "Optimizar para futuras actualizaciones", icon: Zap },
  ]

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[#f5f5f5] dark:bg-[#0A0A0A]">
        <AppSidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-auto md:ml-64">
        <div className="p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-6xl mx-auto">
            {/* Mobile Menu and Back Button */}
            <div className="flex items-center justify-between mb-6">
              <Link href="/dashboard">
                <button className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white group">
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span>Volver al dashboard</span>
                </button>
              </Link>
              <MenuButton />
            </div>

            {/* Header with Progress */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-black dark:bg-white rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white dark:text-black" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Crear nueva marca</h1>
                  <p className="text-gray-600 dark:text-gray-400">Configura el análisis de IA-Visibility para tu marca</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-2 mt-6">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center flex-1">
                    <div
                      className={`flex-1 h-1.5 rounded-full transition-all ${
                        s <= step
                          ? "bg-gradient-to-r from-green-500 to-yellow-500"
                          : "bg-gray-200 dark:bg-[#1E1E24]"
                      }`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span className={step === 1 ? "text-gray-900 dark:text-white font-medium" : ""}>Información básica</span>
                <span className={step === 2 ? "text-gray-900 dark:text-white font-medium" : ""}>Objetivos IA</span>
                <span className={step === 3 ? "text-gray-900 dark:text-white font-medium" : ""}>Estrategia</span>
              </div>
            </div>

            {/* Form Card */}
            <Card className="p-6 md:p-8 lg:p-10 bg-white dark:bg-black border-gray-200 dark:border-[#2A2A30]">
              {/* Step 1: Información Básica */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-5 duration-500">
                  <div className="space-y-2">
                    <Label htmlFor="brandName" className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="w-6 h-6 bg-gray-100 dark:bg-[#1E1E24] rounded-full flex items-center justify-center text-xs font-bold text-gray-900 dark:text-white">
                        1
                      </span>
                      Nombre de la marca *
                    </Label>
                    <Input
                      id="brandName"
                      placeholder="Ej: Mentha"
                      value={formData.brandName}
                      onChange={(e) => handleInputChange("brandName", e.target.value)}
                      className="bg-white dark:bg-[#0A0A0F] border-gray-200 dark:border-[#2A2A30] h-12"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">El nombre exacto que quieres que las IA reconozcan</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-900 dark:text-white" />
                      Sitio web *
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://mentha.app"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                      className="bg-white dark:bg-[#0A0A0F] border-gray-200 dark:border-[#2A2A30] h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry" className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Target className="w-4 h-4 text-gray-900 dark:text-white" />
                      Industria / Categoría *
                    </Label>
                    <Input
                      id="industry"
                      placeholder="Ej: SaaS, Marketing Analytics, IA Tools"
                      value={formData.industry}
                      onChange={(e) => handleInputChange("industry", e.target.value)}
                      className="bg-white dark:bg-[#0A0A0F] border-gray-200 dark:border-[#2A2A30] h-12"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ayuda a las IA a categorizar correctamente tu marca</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-900 dark:text-white">
                      Descripción breve *
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe en 2-3 líneas qué hace tu marca y qué problema resuelve..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      className="bg-white dark:bg-[#0A0A0F] border-gray-200 dark:border-[#2A2A30] min-h-[100px] resize-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Esta descripción será analizada para optimizar tu presencia en IA</p>
                  </div>

                  {/* Info Box */}
                  <div className="p-4 bg-gray-50 dark:bg-[#1E1E24] border border-gray-200 dark:border-[#2A2A30] rounded-lg">
                    <div className="flex gap-3">
                      <Brain className="w-5 h-5 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">¿Por qué importa esto?</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          Los modelos de IA necesitan entender <strong>qué hace tu marca</strong> y <strong>en qué categoría clasificarte</strong>. 
                          Una descripción clara aumenta las probabilidades de aparecer en respuestas relevantes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Objetivos de IA-Visibility */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-5 duration-500">
                  <div className="space-y-2">
                    <Label htmlFor="targetAudience" className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="w-6 h-6 bg-gray-100 dark:bg-[#1E1E24] rounded-full flex items-center justify-center text-xs font-bold text-gray-900 dark:text-white">
                        2
                      </span>
                      ¿A quién quieres alcanzar? *
                    </Label>
                    <Textarea
                      id="targetAudience"
                      placeholder="Ej: Equipos de marketing que buscan medir su visibilidad en ChatGPT, Claude y otros LLMs..."
                      value={formData.targetAudience}
                      onChange={(e) => handleInputChange("targetAudience", e.target.value)}
                      className="bg-white dark:bg-[#0A0A0F] border-gray-200 dark:border-[#2A2A30] min-h-[80px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="keyTerms" className="text-sm font-medium text-gray-900 dark:text-white">
                      Términos clave que te representan *
                    </Label>
                    <Textarea
                      id="keyTerms"
                      placeholder="Ej: análisis de IA, visibilidad en LLM, brand tracking en ChatGPT, IA-SEO..."
                      value={formData.keyTerms}
                      onChange={(e) => handleInputChange("keyTerms", e.target.value)}
                      className="bg-white dark:bg-[#0A0A0F] border-gray-200 dark:border-[#2A2A30] min-h-[80px] resize-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Los modelos aprenden por <strong>asociación semántica</strong>. Estos términos definen tu dominio.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="competitors" className="text-sm font-medium text-gray-900 dark:text-white">
                      Competidores principales
                    </Label>
                    <Input
                      id="competitors"
                      placeholder="Ej: Profound, Writer, MarketMuse"
                      value={formData.competitors}
                      onChange={(e) => handleInputChange("competitors", e.target.value)}
                      className="bg-white dark:bg-[#0A0A0F] border-gray-200 dark:border-[#2A2A30] h-12"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Mentha analizará por qué ellos aparecen y cómo puedes competir</p>
                  </div>

                  {/* Objectives Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-900 dark:text-white">
                      ¿Qué quieres lograr con IA-Visibility?
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {aiGoalOptions.map((goal) => {
                        const Icon = goal.icon
                        const isSelected = formData.aiGoals.includes(goal.id)
                        return (
                          <button
                            key={goal.id}
                            type="button"
                            onClick={() => toggleGoal(goal.id)}
                            className={`p-4 rounded-lg border-2 transition-all text-left relative ${
                              isSelected
                                ? "border-gray-900 dark:border-white bg-gray-50 dark:bg-[#1E1E24]"
                                : "border-gray-200 dark:border-[#2A2A30] hover:border-gray-400 dark:hover:border-gray-600"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <Icon className={`w-5 h-5 flex-shrink-0 ${isSelected ? "text-gray-900 dark:text-white" : "text-gray-400"}`} />
                              <span className={`text-sm font-medium ${isSelected ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                                {goal.label}
                              </span>
                              {isSelected && (
                                <Check className="w-5 h-5 text-gray-900 dark:text-white absolute top-3 right-3" />
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="p-4 bg-gray-50 dark:bg-[#1E1E24] border border-gray-200 dark:border-[#2A2A30] rounded-lg">
                    <div className="flex gap-3">
                      <Target className="w-5 h-5 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">El juego cambió</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          En el SEO clásico sabías el camino: <strong>contenido → indexación → ranking → clics</strong>. 
                          En IA-SEO no hay "ranking". Las IA te <strong>mencionan o no te mencionan</strong>. 
                          Mentha te ayuda a aumentar esa probabilidad.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Contexto Estratégico */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-5 duration-500">
                  <div className="space-y-2">
                    <Label htmlFor="uniqueValue" className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="w-6 h-6 bg-gray-100 dark:bg-[#1E1E24] rounded-full flex items-center justify-center text-xs font-bold text-gray-900 dark:text-white">
                        3
                      </span>
                      ¿Qué te hace único? *
                    </Label>
                    <Textarea
                      id="uniqueValue"
                      placeholder="Ej: Mentha es la única plataforma que mide en tiempo real cómo ChatGPT, Claude, Gemini y Perplexity perciben tu marca..."
                      value={formData.uniqueValue}
                      onChange={(e) => handleInputChange("uniqueValue", e.target.value)}
                      className="bg-white dark:bg-[#0A0A0F] border-gray-200 dark:border-[#2A2A30] min-h-[100px] resize-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Tu propuesta de valor única es lo que Mentha resaltará para diferenciarte
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contentStrategy" className="text-sm font-medium text-gray-900 dark:text-white">
                      ¿Qué contenido publicas regularmente?
                    </Label>
                    <Textarea
                      id="contentStrategy"
                      placeholder="Ej: Artículos en blog, casos de estudio, guías técnicas, contenido en LinkedIn..."
                      value={formData.contentStrategy}
                      onChange={(e) => handleInputChange("contentStrategy", e.target.value)}
                      className="bg-white dark:bg-[#0A0A0F] border-gray-200 dark:border-[#2A2A30] min-h-[80px] resize-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Los LLMs se alimentan de contenido público. Mentha te dirá qué optimizar.
                    </p>
                  </div>

                  {/* Strategic Insights */}
                  <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Lo que Mentha hará por ti:</h3>
                    
                    <div className="space-y-3">
                      <div className="flex gap-3 p-3 bg-gray-50 dark:bg-[#1E1E24] rounded-lg border border-gray-200 dark:border-[#2A2A30]">
                        <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-4 h-4 text-white dark:text-black" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">Detectar si apareces</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Queries automáticas a todos los LLMs principales para medir tu <strong>IA-Visibility Score</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 p-3 bg-gray-50 dark:bg-[#1E1E24] rounded-lg border border-gray-200 dark:border-[#2A2A30]">
                        <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center flex-shrink-0">
                          <Brain className="w-4 h-4 text-white dark:text-black" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">Identificar por qué no apareces</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Análisis de conceptos dominantes, marcas asociadas y fuentes citadas por las IA
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 p-3 bg-gray-50 dark:bg-[#1E1E24] rounded-lg border border-gray-200 dark:border-[#2A2A30]">
                        <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-white dark:text-black" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">Predecir cómo influir</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Sugerencias de contenido, plataformas y términos para aumentar tu probabilidad de mención
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 p-3 bg-gray-50 dark:bg-[#1E1E24] rounded-lg border border-gray-200 dark:border-[#2A2A30]">
                        <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-4 h-4 text-white dark:text-black" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-0.5">Medir señales indirectas</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Crawlers de IA visitando tu web, citas en Gemini/Perplexity, y aprendizaje semántico
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Final Note */}
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-[#1E1E24] dark:to-[#2A2A30] rounded-lg border border-gray-200 dark:border-[#2A2A30]">
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      <strong>Nota importante:</strong> No podemos prometer "aparecer en ChatGPT mañana" porque no controlamos los modelos. 
                      Pero <strong>sí podemos mejorar tu probabilidad</strong> de ser reconocido, midiendo, optimizando y monitorizando tu presencia en IA.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-[#2A2A30]">
                {step > 1 ? (
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="bg-transparent dark:bg-transparent border-gray-300 dark:border-[#2A2A30]"
                  >
                    ← Anterior
                  </Button>
                ) : (
                  <div />
                )}

                {step < totalSteps ? (
                  <Button
                    onClick={handleNext}
                    className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black ml-auto"
                  >
                    Siguiente →
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    className="bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black ml-auto"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Crear marca
                  </Button>
                )}
              </div>
            </Card>

            {/* Bottom Info */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Al crear una marca, Mentha comenzará a monitorizar tu visibilidad en los principales modelos de IA
              </p>
            </div>
          </div>
        </div>
      </main>
      </div>
    </SidebarProvider>
  )
}
