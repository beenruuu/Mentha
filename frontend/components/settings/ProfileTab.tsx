'use client'

import { useState } from "react"
import { User, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Download } from "lucide-react"

interface ProfileTabProps {
    t: Record<string, string>
    user: any
    firstName: string
    setFirstName: (value: string) => void
    lastName: string
    setLastName: (value: string) => void
    onUserUpdated: () => void
}

export function ProfileTab({
    t,
    user,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    onUserUpdated
}: ProfileTabProps) {
    const router = useRouter()
    const supabase = createClient()
    const [isSavingProfile, setIsSavingProfile] = useState(false)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const [isExporting, setIsExporting] = useState(false)

    const handleExportData = async () => {
        setIsExporting(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) return

            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/compliance/export?format=json`
            console.log('Fetching export from:', apiUrl)

            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })

            if (!response.ok) throw new Error('Export failed')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `mentha-export-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success(t.dataExported)

        } catch (error) {
            console.error('Export error:', error)
            toast.error(t.exportError)
        } finally {
            setIsExporting(false)
        }
    }

    const compressImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target?.result as string
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const MAX_WIDTH = 300
                    const MAX_HEIGHT = 300
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width
                            width = MAX_WIDTH
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height
                            height = MAX_HEIGHT
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0, width, height)

                    canvas.toBlob(
                        (blob) => {
                            if (blob) resolve(blob)
                            else reject(new Error('Canvas to Blob failed'))
                        },
                        'image/jpeg',
                        0.7
                    )
                }
                img.onerror = (error) => reject(error)
            }
            reader.onerror = (error) => reject(error)
        })
    }

    const handleSaveProfile = async () => {
        if (!firstName.trim()) {
            toast.error(t.nameRequired)
            return
        }

        setIsSavingProfile(true)
        try {
            const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            })

            if (error) throw error

            toast.success(t.profileUpdatedSuccess, {
                description: t.changesSaved
            })
            onUserUpdated()
            router.refresh()
        } catch (error: any) {
            console.error('Failed to update profile:', error)
            toast.error(t.errorUpdatingProfile, {
                description: error.message || t.tryAgain
            })
        } finally {
            setIsSavingProfile(false)
        }
    }

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsUploadingAvatar(true)
        try {
            const compressedBlob = await compressImage(file)
            const compressedFile = new File([compressedBlob], file.name, {
                type: 'image/jpeg',
            })

            const fileExt = 'jpg'
            const fileName = `${user.id}-${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, compressedFile)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            })

            if (updateError) throw updateError

            toast.success(t.profileUpdatedSuccess)
            onUserUpdated()
            router.refresh()
            window.dispatchEvent(new CustomEvent('user-updated'))

        } catch (error: any) {
            console.error('Error uploading avatar:', error)
            toast.error(t.uploadImageError, {
                description: error.message
            })
        } finally {
            setIsUploadingAvatar(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>{t.personalInformation}</CardTitle>
                    <CardDescription>{t.personalInfoDescription}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <Avatar className="w-24 h-24 ring-4 ring-secondary/50">
                                <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
                                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                    {user?.email?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {isUploadingAvatar && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="avatar-upload" className="cursor-pointer">
                                <div className="flex items-center gap-2 px-4 py-2 border border-border/40 rounded-md hover:bg-secondary/50 transition-colors">
                                    <span className="text-sm font-medium">{t.changeAvatar}</span>
                                </div>
                                <Input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                    disabled={isUploadingAvatar}
                                />
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                JPG, PNG. Max 2MB.
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">{t.firstName}</Label>
                            <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">{t.lastName}</Label>
                            <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">{t.email}</Label>
                        <Input id="email" value={user?.email || ""} disabled className="bg-secondary/50" />
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleSaveProfile} disabled={isSavingProfile}>
                            {isSavingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t.saveChanges}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>{t.yourData}</CardTitle>
                    <CardDescription>{t.yourDataDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium">{t.exportData}</h4>
                            <p className="text-sm text-muted-foreground">
                                {t.exportDataDescription}
                            </p>
                        </div>
                        <Button variant="outline" onClick={handleExportData} disabled={isExporting}>
                            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                            {t.exportMyData}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
