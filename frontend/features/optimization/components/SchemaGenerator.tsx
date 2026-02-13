'use client'

import { useState } from 'react'
import { Copy, Check, Code, Info } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface SchemaGeneratorProps {
    brandName: string
    brandUrl: string
    brandDescription?: string
    logoUrl?: string
}

export function SchemaGenerator({ brandName, brandUrl, brandDescription = '', logoUrl = '' }: SchemaGeneratorProps) {
    const { toast } = useToast()
    const [activeTab, setActiveTab] = useState('organization')
    const [copied, setCopied] = useState(false)

    // Organization State
    const [orgType, setOrgType] = useState('Organization')
    const [orgName, setOrgName] = useState(brandName)
    const [orgUrl, setOrgUrl] = useState(brandUrl)
    const [orgLogo, setOrgLogo] = useState(logoUrl)
    const [orgDescription, setOrgDescription] = useState(brandDescription)
    const [orgSameAs, setOrgSameAs] = useState('')

    // FAQ State
    const [faqs, setFaqs] = useState([{ question: '', answer: '' }])

    // Product State
    const [productName, setProductName] = useState('')
    const [productDescription, setProductDescription] = useState('')
    const [productImage, setProductImage] = useState('')
    const [productPrice, setProductPrice] = useState('')
    const [productCurrency, setProductCurrency] = useState('USD')

    const generateOrganizationSchema = () => {
        const schema: any = {
            "@context": "https://schema.org",
            "@type": orgType,
            "name": orgName,
            "url": orgUrl,
            "description": orgDescription
        }

        if (orgLogo) {
            schema["logo"] = orgLogo
        }

        if (orgSameAs) {
            schema["sameAs"] = orgSameAs.split(',').map(url => url.trim()).filter(url => url.length > 0)
        }

        return JSON.stringify(schema, null, 2)
    }

    const generateFAQSchema = () => {
        const schema = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.filter(f => f.question && f.answer).map(f => ({
                "@type": "Question",
                "name": f.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": f.answer
                }
            }))
        }
        return JSON.stringify(schema, null, 2)
    }

    const generateProductSchema = () => {
        const schema: any = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": productName,
            "description": productDescription,
        }

        if (productImage) schema["image"] = [productImage]

        if (productPrice) {
            schema["offers"] = {
                "@type": "Offer",
                "priceCurrency": productCurrency,
                "price": productPrice,
                "availability": "https://schema.org/InStock"
            }
        }

        return JSON.stringify(schema, null, 2)
    }

    const getCurrentSchema = () => {
        switch (activeTab) {
            case 'organization': return generateOrganizationSchema()
            case 'faq': return generateFAQSchema()
            case 'product': return generateProductSchema()
            default: return ''
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(getCurrentSchema())
        setCopied(true)
        toast({
            title: "Copied to clipboard",
            description: "Paste this code into your website's <head> section.",
        })
        setTimeout(() => setCopied(false), 2000)
    }

    const addFaq = () => setFaqs([...faqs, { question: '', answer: '' }])

    const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
        const newFaqs = [...faqs]
        newFaqs[index][field] = value
        setFaqs(newFaqs)
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Input Section */}
            <div className="space-y-6">
                <Tabs defaultValue="organization" onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="organization">Organization</TabsTrigger>
                        <TabsTrigger value="faq">FAQ Page</TabsTrigger>
                        <TabsTrigger value="product">Product</TabsTrigger>
                    </TabsList>

                    <div className="mt-4 space-y-4 p-1">
                        <TabsContent value="organization" className="space-y-4">
                            <div className="space-y-2">
                                <Label>Organization Type</Label>
                                <Select value={orgType} onValueChange={setOrgType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Organization">Organization (Generic)</SelectItem>
                                        <SelectItem value="Corporation">Corporation</SelectItem>
                                        <SelectItem value="LocalBusiness">Local Business</SelectItem>
                                        <SelectItem value="OnlineBusiness">Online Business</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Name</Label>
                                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>URL</Label>
                                <Input value={orgUrl} onChange={(e) => setOrgUrl(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Logo URL</Label>
                                <Input value={orgLogo} onChange={(e) => setOrgLogo(e.target.value)} placeholder="https://..." />
                            </div>
                            <div className="space-y-2">
                                <Label>Social Profiles (comma separated)</Label>
                                <Textarea
                                    value={orgSameAs}
                                    onChange={(e) => setOrgSameAs(e.target.value)}
                                    placeholder="https://twitter.com/brand, https://linkedin.com/company/brand"
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="faq" className="space-y-4">
                            {faqs.map((faq, index) => (
                                <Card key={index} className="p-4 space-y-3">
                                    <div className="space-y-2">
                                        <Label>Question {index + 1}</Label>
                                        <Input
                                            value={faq.question}
                                            onChange={(e) => updateFaq(index, 'question', e.target.value)}
                                            placeholder="e.g. What is your return policy?"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Answer</Label>
                                        <Textarea
                                            value={faq.answer}
                                            onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                                            placeholder="e.g. We offer a 30-day return policy..."
                                        />
                                    </div>
                                </Card>
                            ))}
                            <Button onClick={addFaq} variant="outline" className="w-full">
                                + Add Question
                            </Button>
                        </TabsContent>

                        <TabsContent value="product" className="space-y-4">
                            <div className="space-y-2">
                                <Label>Product Name</Label>
                                <Input value={productName} onChange={(e) => setProductName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea value={productDescription} onChange={(e) => setProductDescription(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Price</Label>
                                    <Input value={productPrice} onChange={(e) => setProductPrice(e.target.value)} type="number" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Currency</Label>
                                    <Select value={productCurrency} onValueChange={setProductCurrency}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                            <SelectItem value="GBP">GBP (£)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Image URL</Label>
                                <Input value={productImage} onChange={(e) => setProductImage(e.target.value)} placeholder="https://..." />
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            {/* Preview Section */}
            <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden flex flex-col h-full min-h-[400px]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-medium text-zinc-200">JSON-LD Output</span>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                        onClick={handleCopy}
                    >
                        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? 'Copied' : 'Copy Code'}
                    </Button>
                </div>
                <div className="flex-1 p-4 overflow-auto">
                    <pre className="text-sm font-mono text-emerald-400 whitespace-pre-wrap">
                        {getCurrentSchema()}
                    </pre>
                </div>
                <div className="p-3 bg-zinc-900/50 border-t border-zinc-800 text-xs text-zinc-500 flex items-center gap-2">
                    <Info className="w-3 h-3" />
                    Paste this inside the &lt;head&gt; tag of your website.
                </div>
            </div>
        </div>
    )
}
