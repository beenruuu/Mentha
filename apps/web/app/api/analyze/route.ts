import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { brand, category } = body || {};

        // Mock response to avoid external dependency on @google/genai at build time
        const mock = {
            sentiment: 'Neutral',
            visibilityScore: 42,
            topAssociation: brand ? `${brand} (${category || 'general'})` : 'Processing',
            recommendation: 'Improve structured data and citations to authoritative sources.',
            simulationOutput: `Sample simulated response for ${brand || 'brand'} in ${category || 'category'}`,
        };

        return NextResponse.json(mock);
    } catch (err) {
        return NextResponse.json({
            sentiment: 'Analyzing...',
            visibilityScore: 0,
            topAssociation: 'Processing',
            recommendation: 'Please try again later or contact us.',
            simulationOutput:
                'System is currently experiencing heavy load. Unable to generate real-time simulation.',
        });
    }
}
