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
    utils
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
