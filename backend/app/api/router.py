from fastapi import APIRouter

from app.api.endpoints import (
    auth,
    brands,
    analysis,
    llm,
    vectordb,
    recommendations,
    notifications,
    queries,
    keywords,
    competitors,
    utils,
    geo_analysis,
    citations,
    knowledge_graph,
    admin,
    cms,
    lab,
    prompt_tracking,
    export,
    sentiment,
    organization,
    compliance,
    hallucinations,
    insights,
    agent,
    features,
    llms_txt,
    schema,
    technical_aeo
)

api_router = APIRouter()

# Include sub-routers for different API endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(llm.router, prefix="/llm", tags=["LLM Services"])
api_router.include_router(vectordb.router, prefix="/vectordb", tags=["Vector Database"])
api_router.include_router(brands.router, prefix="/brands", tags=["Brands"])
api_router.include_router(keywords.router, prefix="/keywords", tags=["Keywords"])
api_router.include_router(competitors.router, prefix="/competitors", tags=["competitors"])
api_router.include_router(utils.router, prefix="/utils", tags=["utils"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(queries.router, prefix="/queries", tags=["Queries"])
api_router.include_router(geo_analysis.router, tags=["GEO Analysis"])
api_router.include_router(citations.router, tags=["Citations"])
api_router.include_router(knowledge_graph.router, tags=["Knowledge Graph"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(cms.router, prefix="/cms", tags=["CMS"])
api_router.include_router(lab.router, prefix="/lab", tags=["Lab"])

# Core AEO Feature endpoints
api_router.include_router(prompt_tracking.router, tags=["Prompt Tracking"])
api_router.include_router(export.router, tags=["Export"])
api_router.include_router(sentiment.router, tags=["Sentiment Analysis"])
api_router.include_router(organization.router, prefix="/organization", tags=["Organization"])
api_router.include_router(compliance.router, prefix="/compliance", tags=["Compliance"])

# Core AEO Services
api_router.include_router(hallucinations.router, tags=["Hallucinations"])
api_router.include_router(insights.router, prefix="/insights", tags=["Insights"])

# Firecrawl Agent - Autonomous web data discovery
api_router.include_router(agent.router, prefix="/agent", tags=["Firecrawl Agent"])

# Feature Toggles API
api_router.include_router(features.router, tags=["Features"])

# Enterprise AEO/GEO Generation Tools
api_router.include_router(llms_txt.router, tags=["llms.txt Generator"])
api_router.include_router(schema.router, tags=["Schema Generator"])

# Technical AEO Endpoint
api_router.include_router(technical_aeo.router, tags=["Technical AEO"])
