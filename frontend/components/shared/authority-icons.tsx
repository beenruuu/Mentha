'use client'

import { cn } from "@/lib/utils"

// SVG icons for authority sources - inline for better performance
export function WikipediaIcon({ className }: { className?: string }) {
    return (
        <svg className={cn("w-4 h-4", className)} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.09 13.119c-.936 1.932-2.217 4.548-2.853 5.728-.616 1.074-1.127.931-1.532.029-1.406-3.321-4.293-9.144-5.651-12.409-.251-.601-.441-.987-.619-1.139-.181-.15-.554-.24-1.122-.271C.103 5.033 0 4.982 0 4.898v-.455l.052-.045c.924-.005 5.401 0 5.401 0l.051.045v.434c0 .119-.075.176-.225.176l-.564.031c-.485.029-.727.164-.727.436 0 .135.053.33.166.601 1.082 2.646 4.818 10.521 4.818 10.521l.136.046 2.411-4.81-.482-1.067-1.658-3.264s-.318-.654-.428-.872c-.728-1.443-.712-1.518-1.447-1.617-.207-.028-.344-.058-.344-.191v-.495l.068-.042s1.914-.005 3.857 0l.053.046v.453c0 .119-.075.166-.215.166l-.445.027c-.387.024-.533.145-.533.408 0 .135.038.299.127.502l1.992 4.279 2.02-4.102c.089-.211.129-.387.129-.535 0-.254-.136-.39-.396-.405l-.548-.034c-.158 0-.236-.057-.236-.176v-.453l.053-.046s2.04-.005 3.484 0l.068.046v.453c0 .119-.06.176-.181.176-.672.018-1.077.287-1.401.858-.289.508-2.242 4.678-2.242 4.678l2.943 5.849 2.857-5.764c.084-.213.122-.405.122-.576 0-.284-.156-.461-.473-.516l-.524-.047c-.151 0-.226-.057-.226-.176v-.434l.068-.045s1.959-.005 3.256 0l.056.045v.434c0 .119-.061.176-.181.176-.721.009-1.186.289-1.53.856-.168.283-3.394 7.219-3.604 7.654-.483.993-1.014 1.025-1.447.043-.413-.939-2.319-4.666-2.319-4.666l-2.437 4.686c-.444.969-.996 1.001-1.413.055l-2.401-5.609-.012-.028z" />
        </svg>
    )
}

export function G2Icon({ className }: { className?: string }) {
    return (
        <svg className={cn("w-4 h-4", className)} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.243 16.07c-.633.316-1.35.475-2.15.475-1.2 0-2.15-.358-2.85-1.075-.7-.717-1.05-1.667-1.05-2.85v-.35h3.65v.35c0 .5.1.883.3 1.15.2.267.483.4.85.4.383 0 .683-.117.9-.35.217-.233.325-.567.325-1 0-.5-.142-.908-.425-1.225-.283-.317-.775-.642-1.475-.975-.917-.433-1.617-.917-2.1-1.45-.483-.533-.725-1.233-.725-2.1 0-.983.292-1.767.875-2.35.583-.583 1.383-.875 2.4-.875 1.017 0 1.817.317 2.4.95.583.633.875 1.5.875 2.6h-3.5c0-.383-.075-.675-.225-.875-.15-.2-.367-.3-.65-.3-.267 0-.475.092-.625.275-.15.183-.225.442-.225.775 0 .417.117.758.35 1.025.233.267.642.542 1.225.825.933.45 1.667.958 2.2 1.525.533.567.8 1.292.8 2.175 0 1.05-.292 1.875-.875 2.475-.583.6-1.375.9-2.375.9z" />
        </svg>
    )
}

export function CapterraIcon({ className }: { className?: string }) {
    return (
        <svg className={cn("w-4 h-4", className)} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L1.5 6v12L12 24l10.5-6V6L12 0zm6.75 15.75L12 19.5l-6.75-3.75V8.25L12 4.5l6.75 3.75v7.5z" />
            <path d="M12 7.5L8.25 9.75v4.5L12 16.5l3.75-2.25v-4.5L12 7.5z" />
        </svg>
    )
}

export function TechCrunchIcon({ className }: { className?: string }) {
    return (
        <svg className={cn("w-4 h-4", className)} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.83 6.98h-6.7V4.72h-4.28v2.26H3.17v2.23h3.38v10.07h4.3V9.21h2.12v10.07h4.28V9.21h3.58V6.98z" />
        </svg>
    )
}

export function ForbesIcon({ className }: { className?: string }) {
    return (
        <svg className={cn("w-4 h-4", className)} viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.375 4.5h11.25v2.25h-4.5v12.75h-2.25V6.75h-4.5V4.5zM3 4.5h2.25v15h-2.25v-15zM18.75 4.5H21v15h-2.25v-15z" />
        </svg>
    )
}

export function MediumIcon({ className }: { className?: string }) {
    return (
        <svg className={cn("w-4 h-4", className)} viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z" />
        </svg>
    )
}

export function ProductHuntIcon({ className }: { className?: string }) {
    return (
        <svg className={cn("w-4 h-4", className)} viewBox="0 0 24 24" fill="currentColor">
            <path d="M13.604 8.4h-3.405V12h3.405a1.8 1.8 0 001.8-1.8 1.8 1.8 0 00-1.8-1.8zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4h-3.405V18H7.801V6h5.804a4.2 4.2 0 014.2 4.2 4.2 4.2 0 01-4.2 4.2z" />
        </svg>
    )
}

export function TrustpilotIcon({ className }: { className?: string }) {
    return (
        <svg className={cn("w-4 h-4", className)} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
    )
}

export function LinkedInIcon({ className }: { className?: string }) {
    return (
        <svg className={cn("w-4 h-4", className)} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    )
}

// Map of authority source names to their icons
export const authoritySourceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    'Wikipedia': WikipediaIcon,
    'G2': G2Icon,
    'Capterra': CapterraIcon,
    'TechCrunch': TechCrunchIcon,
    'Forbes': ForbesIcon,
    'Medium': MediumIcon,
    'ProductHunt': ProductHuntIcon,
    'Trustpilot': TrustpilotIcon,
    'LinkedIn': LinkedInIcon,
}

// Get icon for a source name, returns null if not found
export function getAuthorityIcon(sourceName: string) {
    return authoritySourceIcons[sourceName] || null
}
