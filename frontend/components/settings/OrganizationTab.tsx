'use client'

import { useQuery } from "@tanstack/react-query"
import { Building2, Users, Plus, Shield } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

type Member = {
    id: string
    full_name: string
    email: string
    avatar_url?: string
    role: "owner" | "admin" | "member" | "viewer"
}

interface OrganizationTabProps {
    t: Record<string, string>
}

export function OrganizationTab({ t }: OrganizationTabProps) {
    const { data: members, isLoading: isLoadingMembers } = useQuery({
        queryKey: ["orgMembers"],
        queryFn: async () => {
            // Mock data until endpoint is fully linked
            return [
                { id: "1", full_name: "Rubén (Tú)", email: "ruben@mentha.ai", role: "owner", avatar_url: "" },
                { id: "2", full_name: "Demo User", email: "demo@mentha.ai", role: "viewer", avatar_url: "" }
            ] as Member[]
        }
    })

    const handleInvite = () => {
        toast.info(t.inviteFunctionalityInDev)
    }

    return (
        <div className="space-y-6">
            <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-gray-500" />
                        {t.companyDetails}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-sm font-medium text-gray-500 block mb-1">{t.name}</label>
                            <p className="text-lg font-medium">Mentha Inc.</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500 block mb-1">{t.currentPlanLabel}</label>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-xs font-bold border-none">PRO</span>
                                <span className="text-xs text-muted-foreground">{t.renewsOn} 01/01/2026</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-gray-500" />
                            {t.teamMembers}
                        </CardTitle>
                        <CardDescription>{t.peopleWithAccess}</CardDescription>
                    </div>
                    <Button onClick={handleInvite} size="sm" className="gap-2">
                        <Plus className="w-4 h-4" /> {t.invite}
                    </Button>
                </CardHeader>
                <CardContent>
                    {isLoadingMembers ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between py-2">
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="h-10 w-10 rounded-full bg-secondary animate-pulse" />
                                        <div className="space-y-2 flex-1">
                                            <div className="h-4 w-[200px] bg-secondary animate-pulse rounded" />
                                            <div className="h-3 w-[150px] bg-secondary animate-pulse rounded" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="divide-y dark:divide-gray-800">
                            {members?.map((member) => (
                                <div key={member.id} className="flex items-center justify-between py-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={member.avatar_url} />
                                            <AvatarFallback>{member.full_name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-sm">{member.full_name}</p>
                                            <p className="text-xs text-muted-foreground">{member.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${member.role === 'owner' ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                                            {member.role === 'owner' && <Shield className="w-3 h-3" />}
                                            {member.role.toUpperCase()}
                                        </span>
                                        {member.role !== 'owner' && (
                                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8">
                                                {t.remove}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
