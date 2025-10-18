import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function analyzeContentWithClaude(content: string, domain: string) {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are an AI optimization expert specializing in AEO (AI Engine Optimization). 
          Analyze this content from ${domain} for visibility in AI search engines:

          ${content}

          Provide a comprehensive analysis including:
          1. Overall AEO score (0-100)
          2. Key strengths
          3. Areas for improvement
          4. Specific recommendations for better AI visibility
          5. Keyword opportunities

          Return as JSON with structure: {score, strengths: [], weaknesses: [], recommendations: [], keywords: []}`,
        },
      ],
    })

    const textContent = message.content[0]
    if (textContent.type === 'text') {
      // Extract JSON from the response
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    }

    throw new Error('Failed to parse Claude response')
  } catch (error) {
    console.error('Claude analysis error:', error)
    throw error
  }
}

export async function compareWithCompetitors(
  brandContent: string,
  competitorContents: Array<{ name: string; content: string }>
) {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `Compare this brand's content with competitors for AI search engine visibility:

          BRAND CONTENT:
          ${brandContent}

          COMPETITORS:
          ${competitorContents.map((c, i) => `${i + 1}. ${c.name}:\n${c.content}`).join('\n\n')}

          Provide:
          1. Comparative analysis
          2. What competitors are doing better
          3. Unique opportunities for the brand
          4. Specific action items

          Return as JSON: {comparison, competitorAdvantages: [], opportunities: [], actionItems: []}`,
        },
      ],
    })

    const textContent = message.content[0]
    if (textContent.type === 'text') {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    }

    throw new Error('Failed to parse Claude response')
  } catch (error) {
    console.error('Claude competitor analysis error:', error)
    throw error
  }
}
