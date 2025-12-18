import { NextResponse } from 'next/server'

export const runtime = 'edge' // Run on edge for low latency
export const revalidate = 3600 // Cache for 1 hour

/**
 * Geolocation Proxy Endpoint
 * 
 * Solves CORS issues by making the request server-side.
 * Benefits:
 * - No CORS blocking (server-to-server)
 * - Can easily switch providers
 * - Cached responses (1 hour)
 * - Edge runtime for low latency
 */
export async function GET(request: Request) {
    try {
        // Get client IP from headers (Vercel provides this)
        const forwardedFor = request.headers.get('x-forwarded-for')
        const realIp = request.headers.get('x-real-ip')
        const clientIp = forwardedFor?.split(',')[0] || realIp || ''

        // Call ipapi.co from server (no CORS issues)
        const response = await fetch(
            clientIp ? `https://ipapi.co/${clientIp}/json/` : 'https://ipapi.co/json/',
            {
                headers: {
                    'User-Agent': 'Mentha-AEO/1.0',
                },
                next: { revalidate: 3600 } // Cache for 1 hour
            }
        )

        if (!response.ok) {
            throw new Error('Geolocation service unavailable')
        }

        const data = await response.json()

        // Return only what we need (minimal data)
        return NextResponse.json({
            country_code: data.country_code || 'US',
            country_name: data.country_name || 'United States',
            languages: data.languages || 'en',
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            }
        })
    } catch (error) {
        console.error('Geolocation error:', error)

        // Fallback to default (US/English)
        return NextResponse.json({
            country_code: 'US',
            country_name: 'United States',
            languages: 'en',
            fallback: true
        }, {
            status: 200, // Return 200 even on error (graceful degradation)
            headers: {
                'Cache-Control': 'public, s-maxage=60', // Cache fallback for 1 min
            }
        })
    }
}
