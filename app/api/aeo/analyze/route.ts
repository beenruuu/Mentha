import { createClient } from '@/lib/supabase/server'
import { analyzeContentWithOpenAI } from '@/lib/ai/openai'
import { analyzeContentWithClaude } from '@/lib/ai/anthropic'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, domain, content, keywords, brandId, aiModel } = body

    if (!type || !domain) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create analysis record
    const { data: analysis, error: insertError } = await supabase
      .from('aeo_analyses')
      .insert({
        user_id: user.id,
        brand_id: brandId || null,
        analysis_type: type,
        input_data: { domain, content, keywords },
        status: 'processing',
        ai_model: aiModel || 'chatgpt',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create analysis' }, { status: 500 })
    }

    // Perform AI analysis
    let results
    try {
      if (aiModel === 'claude') {
        results = await analyzeContentWithClaude(content, domain)
      } else {
        results = await analyzeContentWithOpenAI(content, domain)
      }

      // Update analysis with results
      const { error: updateError } = await supabase
        .from('aeo_analyses')
        .update({
          results,
          score: results.score,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', analysis.id)

      if (updateError) {
        console.error('Update error:', updateError)
      }

      // Create recommendations from the analysis
      if (results.recommendations && results.recommendations.length > 0) {
        const recommendations = results.recommendations.map((rec: any) => ({
          user_id: user.id,
          analysis_id: analysis.id,
          brand_id: brandId || null,
          title: rec.title || rec,
          description: rec.description || rec,
          priority: rec.priority || 'medium',
          category: rec.category || 'content',
          implementation_effort: rec.effort || 'medium',
          expected_impact: rec.impact || 'medium',
        }))

        await supabase.from('recommendations').insert(recommendations)
      }

      return NextResponse.json({ 
        success: true, 
        analysis: { ...analysis, results, score: results.score } 
      })
    } catch (aiError) {
      console.error('AI analysis error:', aiError)
      
      // Update analysis with error
      await supabase
        .from('aeo_analyses')
        .update({
          status: 'failed',
          error_message: aiError instanceof Error ? aiError.message : 'Unknown error',
        })
        .eq('id', analysis.id)

      return NextResponse.json(
        { error: 'AI analysis failed', details: aiError instanceof Error ? aiError.message : 'Unknown error' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    const limit = parseInt(searchParams.get('limit') || '10')

    let query = supabase
      .from('aeo_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (brandId) {
      query = query.eq('brand_id', brandId)
    }

    const { data: analyses, error } = await query

    if (error) {
      console.error('Query error:', error)
      return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 })
    }

    return NextResponse.json({ analyses })
  } catch (error) {
    console.error('Get analyses error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
