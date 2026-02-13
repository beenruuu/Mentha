"""
Export API Endpoints

Endpoints for exporting Mentha data in CSV and ZIP formats.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import Response
from typing import Optional
from datetime import datetime

from app.api.deps import get_current_user_id
from app.services.export_service import get_export_service

router = APIRouter(prefix="/export", tags=["Export"])


@router.get("/{brand_id}/keywords")
async def export_keywords(
    brand_id: str,
    include_history: bool = False,
    user_id: str = Depends(get_current_user_id)
):
    """Export keywords data as CSV."""
    service = get_export_service()
    csv_content = await service.export_keywords(brand_id, include_history)
    
    if not csv_content:
        raise HTTPException(status_code=404, detail="No keywords found or export failed")
    
    filename = f"keywords_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    headers = service.generate_csv_response_headers(filename)
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers=headers
    )


@router.get("/{brand_id}/competitors")
async def export_competitors(
    brand_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Export competitors data as CSV."""
    service = get_export_service()
    csv_content = await service.export_competitors(brand_id)
    
    if not csv_content:
        raise HTTPException(status_code=404, detail="No competitors found or export failed")
    
    filename = f"competitors_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    headers = service.generate_csv_response_headers(filename)
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers=headers
    )


@router.get("/{brand_id}/visibility")
async def export_visibility(
    brand_id: str,
    days: int = 90,
    user_id: str = Depends(get_current_user_id)
):
    """Export AI visibility history as CSV."""
    service = get_export_service()
    csv_content = await service.export_visibility_history(brand_id, days)
    
    if not csv_content:
        raise HTTPException(status_code=404, detail="No visibility data found or export failed")
    
    filename = f"visibility_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    headers = service.generate_csv_response_headers(filename)
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers=headers
    )


@router.get("/{brand_id}/mentions")
async def export_mentions(
    brand_id: str,
    days: int = 90,
    user_id: str = Depends(get_current_user_id)
):
    """Export brand mentions as CSV."""
    service = get_export_service()
    csv_content = await service.export_mentions(brand_id, days)
    
    if not csv_content:
        raise HTTPException(status_code=404, detail="No mentions found or export failed")
    
    filename = f"mentions_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    headers = service.generate_csv_response_headers(filename)
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers=headers
    )


@router.get("/{brand_id}/prompts")
async def export_prompts(
    brand_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Export tracked prompts as CSV."""
    service = get_export_service()
    csv_content = await service.export_prompt_tracking(brand_id)
    
    if not csv_content:
        raise HTTPException(status_code=404, detail="No prompts found or export failed")
    
    filename = f"prompts_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    headers = service.generate_csv_response_headers(filename)
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers=headers
    )


@router.get("/{brand_id}/sentiment")
async def export_sentiment(
    brand_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Export sentiment analysis history as CSV."""
    service = get_export_service()
    csv_content = await service.export_sentiment_analysis(brand_id)
    
    if not csv_content:
        raise HTTPException(status_code=404, detail="No sentiment data found or export failed")
    
    filename = f"sentiment_{datetime.utcnow().strftime('%Y%m%d')}.csv"
    headers = service.generate_csv_response_headers(filename)
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers=headers
    )


@router.get("/{brand_id}/all")
async def export_all(
    brand_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Export all data as a ZIP file containing multiple CSVs."""
    service = get_export_service()
    zip_content = await service.export_all_as_zip(brand_id)
    
    if not zip_content:
        raise HTTPException(status_code=500, detail="Export failed")
    
    filename = f"mentha_export_{datetime.utcnow().strftime('%Y%m%d')}.zip"
    headers = service.generate_zip_response_headers(filename)
    
    return Response(
        content=zip_content,
        media_type="application/zip",
        headers=headers
    )
