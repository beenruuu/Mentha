"use client"

import { useState } from "react"
import { Sparkles, Globe, Target, TrendingUp, Brain, Eye, Zap, Check, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { brandsService } from "@/lib/services/brands"
import { analysisService } from "@/lib/services/analysis"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    brandName: "",
    domain: "",
    industry: "",
    description: "",
    targetAudience: "",
    keyTerms: "",
    competitors: "",
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

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const enrichedDescription = `
${formData.description}

--- Strategic Context ---
Target Audience: ${formData.targetAudience}
Unique Value: ${formData.uniqueValue}
Content Strategy: ${formData.contentStrategy}
AI Goals: ${formData.aiGoals.join(", ")}
Key Terms: ${formData.keyTerms}
Competitors: ${formData.competitors}
      `.trim()

      const brand = await brandsService.create({
        name: formData.brandName,
        domain: formData.domain,
        industry: formData.industry,
        description: enrichedDescription
      })

      // Trigger initial analysis
      try {
        await analysisService.create({
          brand_id: brand.id,
          analysis_type: 'domain',
          input_data: {
            domain: brand.domain,
            description: brand.description,
            competitors: formData.competitors,
            keywords: formData.keyTerms
          },
          ai_model: 'chatgpt'
        })
      } catch (error) {
        console.error("Failed to trigger analysis:", error)
      }

      toast({
        title: "Welcome to Mentha!",
        description: "Your brand has been set up. Analysis has started.",
      })
      
      router.push("/dashboard")
    } catch (error) {
      console.error("Error creating brand:", error)
      toast({
        title: "Error",
        description: "Failed to create brand. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
    { id: "visibility", label: "Increase visibility in AI answers", icon: Eye },
    { id: "mentions", label: "Generate more mentions", icon: Sparkles },
    { id: "authority", label: "Establish niche authority", icon: Target },
    { id: "compete", label: "Compete with established brands", icon: TrendingUp },
  ]

  return (
    <div className="min-h-screen bg-[#020817] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 mb-6">
            <Sparkles className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Welcome to Mentha</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Let's set up your brand to start tracking and optimizing your visibility across AI search engines.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step >= s ? "bg-emerald-500 text-white" : "bg-white/10 text-gray-500"
                }`}>
                  {s}
                </div>
                {s < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step > s ? "bg-emerald-500" : "bg-white/10"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="bg-[#0B1121] border-white/10 p-8 md:p-10 shadow-2xl">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white">Brand Essentials</h2>
                <p className="text-gray-400">Tell us about the brand you want to track</p>
              </div>

              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label className="text-white">Brand Name</Label>
                  <Input 
                    value={formData.brandName}
                    onChange={(e) => handleInputChange("brandName", e.target.value)}
                    placeholder="e.g. Mentha"
                    className="bg-white/5 border-white/10 text-white h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Website URL</Label>
                  <Input 
                    value={formData.domain}
                    onChange={(e) => handleInputChange("domain", e.target.value)}
                    placeholder="https://..."
                    className="bg-white/5 border-white/10 text-white h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Industry</Label>
                  <Input 
                    value={formData.industry}
                    onChange={(e) => handleInputChange("industry", e.target.value)}
                    placeholder="e.g. SaaS, E-commerce"
                    className="bg-white/5 border-white/10 text-white h-12"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Context */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white">Strategic Context</h2>
                <p className="text-gray-400">Help AI models understand your positioning</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-white">Short Description</Label>
                  <Textarea 
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="What does your brand do?"
                    className="bg-white/5 border-white/10 text-white min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Target Audience</Label>
                  <Input 
                    value={formData.targetAudience}
                    onChange={(e) => handleInputChange("targetAudience", e.target.value)}
                    placeholder="Who are your ideal customers?"
                    className="bg-white/5 border-white/10 text-white h-12"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aiGoalOptions.map((goal) => {
                    const Icon = goal.icon
                    const isSelected = formData.aiGoals.includes(goal.id)
                    return (
                      <button
                        key={goal.id}
                        onClick={() => toggleGoal(goal.id)}
                        className={`p-4 rounded-lg border transition-all text-left flex items-center gap-3 ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-500/10 text-white"
                            : "border-white/10 hover:border-white/20 text-gray-400"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{goal.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Keywords & Competitors */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white">Market Landscape</h2>
                <p className="text-gray-400">Define your keywords and competitors</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-white">Key Terms (Keywords)</Label>
                  <Textarea 
                    value={formData.keyTerms}
                    onChange={(e) => handleInputChange("keyTerms", e.target.value)}
                    placeholder="e.g. ai analytics, brand tracking, seo tools"
                    className="bg-white/5 border-white/10 text-white min-h-[100px]"
                  />
                  <p className="text-xs text-gray-500">Terms you want to be associated with</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Main Competitors</Label>
                  <Input 
                    value={formData.competitors}
                    onChange={(e) => handleInputChange("competitors", e.target.value)}
                    placeholder="e.g. Competitor A, Competitor B"
                    className="bg-white/5 border-white/10 text-white h-12"
                  />
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 flex gap-3">
                  <Brain className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-emerald-200">
                    Mentha will use this information to analyze your current visibility and provide actionable recommendations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10">
            {step > 1 ? (
              <Button
                onClick={handleBack}
                variant="ghost"
                className="text-gray-400 hover:text-white hover:bg-white/5"
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <Button
                onClick={handleNext}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
              >
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
              >
                {isSubmitting ? "Setting up..." : "Complete Setup"}
                {!isSubmitting && <Check className="w-4 h-4 ml-2" />}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
