from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.core.supabase import get_supabase_client
from app.domain.entities.analysis import Analysis, AnalysisType, AnalysisStatus, AIModel
from app.domain.interfaces.repositories.analysis_repository import AnalysisRepository

class SupabaseAnalysisRepository(AnalysisRepository):
    def __init__(self):
        self.supabase = get_supabase_client()
        self.table_name = "aeo_analyses" # Based on run_analysis code: SupabaseDatabaseService("aeo_analyses", Analysis)

    def _to_entity(self, data: dict) -> Analysis:
        return Analysis(
            id=UUID(data['id']),
            user_id=UUID(data['user_id']),
            brand_id=UUID(data['brand_id']) if data.get('brand_id') else None,
            analysis_type=AnalysisType(data['analysis_type']),
            status=AnalysisStatus(data['status']),
            input_data=data.get('input_data') or {},
            results=data.get('results') or {},
            score=data.get('score'),
            error_message=data.get('error_message'),
            ai_model=AIModel(data['ai_model']) if data.get('ai_model') else None,
            model_name=data.get('model_name'),
            created_at=datetime.fromisoformat(data['created_at'].replace('Z', '+00:00')) if isinstance(data['created_at'], str) else data['created_at'],
            completed_at=datetime.fromisoformat(data['completed_at'].replace('Z', '+00:00')) if isinstance(data.get('completed_at'), str) else data.get('completed_at')
        )

    def _to_dict(self, analysis: Analysis) -> dict:
        data = {
            "user_id": str(analysis.user_id),
            "analysis_type": analysis.analysis_type.value,
            "status": analysis.status.value,
            "input_data": analysis.input_data,
            "results": analysis.results,
            "score": analysis.score,
            "error_message": analysis.error_message,
        }
        if analysis.brand_id:
            data['brand_id'] = str(analysis.brand_id)
        if analysis.ai_model:
            data['ai_model'] = analysis.ai_model.value
        if analysis.model_name:
            data['model_name'] = analysis.model_name
        if analysis.completed_at:
            data['completed_at'] = analysis.completed_at.isoformat()
        if analysis.id:
            data['id'] = str(analysis.id)
            
        return data

    async def get_by_id(self, analysis_id: UUID) -> Optional[Analysis]:
        response = self.supabase.table(self.table_name).select("*").eq("id", str(analysis_id)).execute()
        if not response.data:
            return None
        return self._to_entity(response.data[0])

    async def get_by_brand(self, brand_id: UUID) -> List[Analysis]:
        response = self.supabase.table(self.table_name).select("*").eq("brand_id", str(brand_id)).execute()
        return [self._to_entity(item) for item in response.data]

    async def get_latest_by_brand(self, brand_id: UUID) -> Optional[Analysis]:
        response = self.supabase.table(self.table_name)\
            .select("*")\
            .eq("brand_id", str(brand_id))\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()
        
        if not response.data:
            return None
        return self._to_entity(response.data[0])

    async def get_by_user(self, user_id: UUID) -> List[Analysis]:
        response = self.supabase.table(self.table_name).select("*").eq("user_id", str(user_id)).execute()
        return [self._to_entity(item) for item in response.data]

    async def create(self, analysis: Analysis) -> Analysis:
        data = self._to_dict(analysis)
        # Remove ID to let DB generate it
        if "id" in data:
            del data["id"]
            
        response = self.supabase.table(self.table_name).insert(data).execute()
        if not response.data:
            raise ValueError("Failed to create analysis")
        return self._to_entity(response.data[0])

    async def update(self, analysis: Analysis) -> Analysis:
        if not analysis.id:
            raise ValueError("Analysis ID required for update")
        
        data = self._to_dict(analysis)
        response = self.supabase.table(self.table_name).update(data).eq("id", str(analysis.id)).execute()
        
        if not response.data:
             raise ValueError("Failed to update analysis")
             
        return self._to_entity(response.data[0])

    async def list_pending(self) -> List[Analysis]:
        response = self.supabase.table(self.table_name).select("*").eq("status", AnalysisStatus.PENDING.value).execute()
        return [self._to_entity(item) for item in response.data]
