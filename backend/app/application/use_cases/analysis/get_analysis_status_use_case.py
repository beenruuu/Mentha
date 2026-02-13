from uuid import UUID
from typing import Dict, Any, Optional
from datetime import datetime
from app.domain.entities.analysis import AnalysisStatus
from app.domain.interfaces.repositories.analysis_repository import AnalysisRepository
from app.domain.interfaces.repositories.brand_repository import BrandRepository
from app.domain.exceptions import PermissionDeniedError

class GetAnalysisStatusUseCase:
    def __init__(self, analysis_repository: AnalysisRepository, brand_repository: BrandRepository):
        self.analysis_repository = analysis_repository
        self.brand_repository = brand_repository

    async def execute(self, brand_id: UUID, user_id: UUID) -> Dict[str, Any]:
        # 1. Verify Brand Ownership
        brand = await self.brand_repository.get_by_id(brand_id)
        if brand and brand.user_id != user_id:
             # If brand exists but wrong user. If not exists, we let analysis check find empty or not found.
             # Actually, simpler to just check brand ownership first.
             raise PermissionDeniedError("Not authorized")

        # 2. Get latest analysis
        analysis = await self.analysis_repository.get_latest_by_brand(brand_id)
        
        if not analysis:
            return {
                "status": "none",
                "progress": 0,
                "phase": None,
                "started_at": None,
                "completed_at": None,
                "has_data": False,
                "message": "No hay análisis programados"
            }
            
        # 3. Calculate Progress Logic (Cleaned up from original)
        progress = 0
        phase = "Iniciando..."
        
        if analysis.status == AnalysisStatus.PENDING:
            progress = 5
            phase = "En cola..."
        elif analysis.status == AnalysisStatus.PROCESSING:
            # Estimate progress
            created_at = analysis.created_at
            if created_at:
                # Ensure created_at is not timezone aware if datetime.utcnow() isn't, or unify.
                # data entities created_at is likely timezone aware if from Supabase text.
                # simplified:
                try:
                    now = datetime.utcnow()
                    if created_at.tzinfo:
                         now = now.replace(tzinfo=created_at.tzinfo) # make naive or aware match
                    
                    elapsed = (now - created_at).total_seconds()
                    estimated_duration = 120
                    progress = min(int((elapsed / estimated_duration) * 100), 95)
                except Exception:
                    progress = 50
                
                if progress < 15: phase = "Resolviendo entidad..."
                elif progress < 35: phase = "Recopilando datos web..."
                elif progress < 55: phase = "Midiendo visibilidad IA..."
                elif progress < 75: phase = "Analizando contenido..."
                elif progress < 90: phase = "Generando insights..."
                else: phase = "Finalizando..."
            else:
                progress = 50
                phase = "Procesando..."
        elif analysis.status == AnalysisStatus.COMPLETED:
            progress = 100
            phase = "Completado"
        elif analysis.status == AnalysisStatus.FAILED:
            progress = 0
            phase = "Error"

        # Check for completed data
        # We can loosely check if this analysis is completed, or if *any* is completed.
        # The original code checked specific filter.
        # For this use case, checking if the current one is completed is usually enough,
        # but the dashboard might want to show "previous data available" while "processing new".
        # I'll stick to the current analysis status.
        has_data = analysis.status == AnalysisStatus.COMPLETED

        return {
            "status": analysis.status.value,
            "progress": progress,
            "phase": phase,
            "started_at": analysis.created_at.isoformat() if analysis.created_at else None,
            "completed_at": analysis.completed_at.isoformat() if analysis.completed_at else None,
            "has_data": has_data,
            "analysis_id": str(analysis.id),
            "error_message": analysis.error_message if analysis.status == AnalysisStatus.FAILED else None
        }
