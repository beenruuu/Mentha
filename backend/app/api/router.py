from fastapi import APIRouter

from app.api.endpoints import (
    auth,
    llm,
    vectordb,
    notifications,
    competitors,
    utils,
    geo_analysis,
    citations,
    prompt_tracking,
    export,
    sentiment,
    compliance,
    hallucinations,
    insights,
    agent,
    features,
    llms_txt,
    schema,
    technical_aeo,
    site_audit,
    admin,
    analysis_onboarding,
    crawler_logs,
    knowledge_graph,
)

# New Clean Architecture Controllers
from app.interface_adapters.controllers import brands_controller as brands
from app.interface_adapters.controllers import analysis_controller as analysis

api_router = APIRouter()

# Include sub-routers for different API endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(analysis.router, prefix="/analysis", tags=["Analysis"])
api_router.include_router(analysis_onboarding.router, prefix="/analysis", tags=["Onboarding Analysis"])
api_router.include_router(llm.router, prefix="/llm", tags=["LLM Services"])
api_router.include_router(vectordb.router, prefix="/vectordb", tags=["Vector Database"])
api_router.include_router(brands.router, prefix="/brands", tags=["Brands"])
api_router.include_router(competitors.router, prefix="/competitors", tags=["competitors"])
api_router.include_router(utils.router, prefix="/utils", tags=["utils"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(geo_analysis.router, tags=["GEO Analysis"])
api_router.include_router(citations.router, tags=["Citations"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])

# Core AEO Feature endpoints
api_router.include_router(prompt_tracking.router, tags=["Prompt Tracking"])
api_router.include_router(export.router, tags=["Export"])
api_router.include_router(sentiment.router, tags=["Sentiment Analysis"])

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

# Site Audit - Deep website analysis for AEO/GEO optimization
api_router.include_router(site_audit.router, tags=["Site Audit"])

# Crawler Logs - AI bot activity tracking
api_router.include_router(crawler_logs.router, tags=["Crawler Logs"])

# Knowledge Graph - Entity visualization and graph data
api_router.include_router(knowledge_graph.router, tags=["Knowledge Graph"])

