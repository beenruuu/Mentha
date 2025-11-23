'use client'

import { useOnboarding } from '@/lib/context/onboarding-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState } from 'react'
import { fetchAPI } from '@/lib/api-client'
import { Loader2, Globe, Building2, MapPin, Calendar } from 'lucide-react'

export default function BrandInputStep() {
    const { brandInfo, setBrandInfo, nextStep, prevStep, userInfo } = useOnboarding()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Initialize brand title with company name if available and title is empty
    useState(() => {
        if (!brandInfo.title && userInfo.companyName) {
            setBrandInfo({ ...brandInfo, title: userInfo.companyName })
        }
    })

    const handleUrlBlur = async () => {
        if (!brandInfo.url) return

        setLoading(true)
        setError('')
        try {
            const data = await fetchAPI<{
                url: string
                domain: string
                title: string
                description: string
                favicon: string
                image: string
            }>(`/utils/metadata?url=${encodeURIComponent(brandInfo.url)}`)

            setBrandInfo({
                ...brandInfo,
                url: data.url,
                domain: data.domain,
                // Only update title if it's empty or looks like a URL/Domain, otherwise keep user's input
                title: brandInfo.title && brandInfo.title !== brandInfo.domain ? brandInfo.title : (data.title || userInfo.companyName || data.domain),
                description: data.description,
                favicon: data.favicon,
                logo: data.image,
                // Mocked data for the "Mini-Window" specs that can't be easily scraped
                industry: '',
                location: '',
                founded: '',
                businessModel: ''
            })
        } catch (err) {
            console.error(err)
            setError('Failed to fetch brand details. Please check the URL.')
        } finally {
            setLoading(false)
        }
    }

    const handleNext = () => {
        if (!brandInfo.url) {
            setError('Please enter a valid URL')
            return
        }
        nextStep()
    }

    return (
        <div className="w-full flex justify-center animate-in fade-in duration-500">
            <Card className="w-full max-w-3xl p-10 space-y-8 shadow-2xl border-white/10 bg-black/40 backdrop-blur-xl">
                <div className="space-y-2 text-left">
                    <h1 className="text-3xl font-bold tracking-tight text-white">
                        Start with your brand
                    </h1>
                    <p className="text-muted-foreground">Enter your website to begin the analysis</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="brandName" className="text-sm font-medium text-gray-300">Brand Name</Label>
                        <Input
                            id="brandName"
                            value={brandInfo.title || ''}
                            onChange={(e) => setBrandInfo({ ...brandInfo, title: e.target.value })}
                            placeholder="e.g. Acme Corp"
                            className="h-11 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="url" className="text-sm font-medium text-gray-300">Website URL</Label>
                        <div className="flex gap-2">
                            <Input
                                id="url"
                                value={brandInfo.url}
                                onChange={(e) => setBrandInfo({ ...brandInfo, url: e.target.value })}
                                onBlur={handleUrlBlur}
                                placeholder="https://example.com"
                                className="h-11 bg-white/5 border-white/10 focus:border-primary/50 transition-all"
                            />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>
                </div>

                {/* Mini-Window Card */}
                {(brandInfo.title || loading) && (
                    <div className="mt-8 border border-white/10 rounded-lg overflow-hidden bg-white/5 backdrop-blur-md animate-in slide-in-from-bottom-4 duration-500">
                        {loading ? (
                            <div className="p-8 flex flex-col justify-center items-center gap-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <span className="text-sm text-muted-foreground">Analyzing brand...</span>
                            </div>
                        ) : (
                            <div className="p-6 space-y-6">
                                <div className="flex items-start gap-4">
                                    {brandInfo.favicon ? (
                                        <img src={brandInfo.favicon} alt="Favicon" className="w-12 h-12 rounded-lg object-contain bg-white p-2 shadow-lg" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                                            <Globe className="w-6 h-6 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <h3 className="font-bold text-xl truncate text-white">{brandInfo.title || brandInfo.domain}</h3>
                                        <a href={brandInfo.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block">
                                            {brandInfo.url}
                                        </a>
                                    </div>
                                </div>

                                {brandInfo.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                        {brandInfo.description}
                                    </p>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Industry</span>
                                        <div className="flex items-center gap-2 text-xs font-medium text-white">
                                            <Building2 className="w-3 h-3 text-primary" />
                                            {brandInfo.industry || 'Unknown'}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Location</span>
                                        <div className="flex items-center gap-2 text-xs font-medium text-white">
                                            <MapPin className="w-3 h-3 text-primary" />
                                            {brandInfo.location || 'Unknown'}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Founded</span>
                                        <div className="flex items-center gap-2 text-xs font-medium text-white">
                                            <Calendar className="w-3 h-3 text-primary" />
                                            {brandInfo.founded || 'Unknown'}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Model</span>
                                        <div>
                                            <div className="text-xs font-medium px-2 py-0.5 bg-primary/20 text-primary rounded-full inline-block">
                                                {brandInfo.businessModel || 'Unknown'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-between pt-4">
                    <Button
                        variant="ghost"
                        onClick={prevStep}
                        className="text-muted-foreground hover:text-white"
                    >
                        Back
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={loading || !brandInfo.title}
                        className="bg-white text-black hover:bg-white/90 px-8 h-11 rounded-md font-medium transition-all"
                    >
                        Next
                    </Button>
                </div>
            </Card>
        </div>
    )
}
