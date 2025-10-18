import OpenAI from 'openai'

// Lazy initialization to avoid build errors
let openaiClient: OpenAI | null = null

function getOpenAIClient() {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openaiClient
}

export async function analyzeContentWithOpenAI(content: string, domain: string) {
  try {
    const openai = getOpenAIClient()
    if (!openai) {
      throw new Error('OpenAI client not initialized')
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an AI optimization expert specializing in AEO (AI Engine Optimization). 
          Analyze content for visibility in AI search engines like ChatGPT, Claude, Perplexity, and Gemini.
          Provide actionable recommendations to improve AI discoverability.`,
        },
        {
          role: 'user',
          content: `Analyze this content from ${domain}:\n\n${content}\n\nProvide:
          1. Overall AEO score (0-100)
          2. Key strengths
          3. Areas for improvement
          4. Specific recommendations for better AI visibility
          5. Keyword opportunities
          
          Return as JSON with structure: {score, strengths: [], weaknesses: [], recommendations: [], keywords: []}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')
    return result
  } catch (error) {
    console.error('OpenAI analysis error:', error)
    throw error
  }
}

export async function generateKeywordSuggestions(domain: string, industry: string) {
  try {
    const openai = getOpenAIClient()
    if (!openai) {
      throw new Error('OpenAI client not initialized')
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an AEO keyword research expert. Generate keyword suggestions optimized for AI search engines.',
        },
        {
          role: 'user',
          content: `Generate 20 keyword suggestions for ${domain} in the ${industry} industry that would perform well in AI search engines.
          
          Return as JSON array: [{keyword, intent, difficulty, aiVisibilityPotential}]`,
        },
      ],
      temperature: 0.8,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(completion.choices[0].message.content || '{"keywords":[]}')
    return result.keywords || []
  } catch (error) {
    console.error('OpenAI keyword generation error:', error)
    throw error
  }
}
