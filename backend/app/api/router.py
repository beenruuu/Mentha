from fastapi import APIRouter

from app.api.endpoints import (
    auth,
    brands,
    analysis,
    llm,
    vectordb,
    recommendations,
    notifications,
    technical_aeo,
    queries,
    keywords,
    competitors,
    utils,
    page_analysis,
    geo_analysis,
    citations,
    knowledge_graph,
    eeat,
    admin,
    cms, 
    gsc, 
    lab,
    prompt_tracking,
    export,
    export,
    sentiment,
    export,
    sentiment,
    organization,
    compliance
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
api_router.include_router(technical_aeo.router, prefix="/technical-aeo", tags=["Technical AEO"])
api_router.include_router(queries.router, prefix="/queries", tags=["Queries"])
api_router.include_router(page_analysis.router, tags=["Page Analysis"])
api_router.include_router(geo_analysis.router, tags=["GEO Analysis"])
api_router.include_router(citations.router, tags=["Citations"])
api_router.include_router(knowledge_graph.router, tags=["Knowledge Graph"])
api_router.include_router(eeat.router, tags=["E-E-A-T"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(cms.router, prefix="/cms", tags=["CMS"])
api_router.include_router(gsc.router, prefix="/gsc", tags=["GSC"])
api_router.include_router(lab.router, prefix="/lab", tags=["Lab"])

# New AEO Feature endpoints
api_router.include_router(prompt_tracking.router, tags=["Prompt Tracking"])
api_router.include_router(export.router, tags=["Export"])
api_router.include_router(sentiment.router, tags=["Sentiment Analysis"])
api_router.include_router(organization.router, prefix="/organization", tags=["Organization"])
api_router.include_router(compliance.router, prefix="/compliance", tags=["Compliance"])
