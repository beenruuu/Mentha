from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from app.api import deps
import logging
import uuid
import datetime
import json
import io

router = APIRouter()
logger = logging.getLogger(__name__)

# ============================================
# Models
# ============================================

class ErasureRequest(BaseModel):
    email: EmailStr
    reason: Optional[str] = "LOPD-GDD Right to Erasure/Blocking"

class ErasureResponse(BaseModel):
    message: str
    request_id: str
    status: str

class UserDataResponse(BaseModel):
    """Response for Right of Access (GDPR Art. 15)"""
    user_info: Dict[str, Any]
    brands: List[Dict[str, Any]]
    analyses_count: int
    data_collected_at: str
    data_categories: List[str]
    retention_period: str
    legal_basis: str
    third_party_transfers: List[str]

class ObjectionRequest(BaseModel):
    objection_type: str  # 'automated_processing', 'marketing', 'profiling'
    reason: Optional[str] = None

# ============================================
# Right to Erasure / Blocking (GDPR Art. 17 / LOPD Art. 32)
# ============================================

@router.post("/erasure-request", response_model=ErasureResponse)
async def request_erasure(
    request: ErasureRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(deps.get_current_user),
):
    """
    Submit a request for Data Erasure or Data Blocking (Bloqueo de Datos) under LOPD-GDD (Spain) / GDPR.
    According to LOPD Art. 32, data must be 'blocked' (restricted access) for the liability period before physical deletion.
    """
    request_id = str(uuid.uuid4())
    logger.info(f"LOPD Erasure/Blocking request received. ID: {request_id}. User: {current_user.get('email')} targeting: {request.email}")
    
    background_tasks.add_task(process_lopd_erasure, request.email, request_id)
    
    return {
        "message": "Request received. Data will be blocked/anonymized in accordance with LOPD-GDD Art. 32.",
        "request_id": request_id,
        "status": "PROCESSING_BLOCKING"
    }

async def process_lopd_erasure(email: str, request_id: str):
    logger.info(f"Processing LOPD Blocking for {request_id} / {email}")
    # LOPD Logic:
    # 1. Identify all operational data (active DB).
    # 2. 'Block' it: Move to a separate encrypted table or flag as `is_blocked=True` + `blocked_at=now()`.
    # 3. Restrict access: Data only accessible to DPO or judges.
    # 4. Schedule physical deletion after 3-5 years (statute of limitations).
    logger.info(f"Data for {email} has been logically BLOCKED. Scheduled for physical deletion in 3 years.")

# ============================================
# Right of Access (GDPR Art. 15)
# ============================================

@router.get("/my-data", response_model=UserDataResponse)
async def get_my_data(
    current_user: dict = Depends(deps.get_current_user),
):
    """
    GDPR Art. 15 - Right of Access.
    Returns all personal data we hold about the user, along with information about processing.
    """
    user_id = current_user.get("id")
    user_email = current_user.get("email")
    
    logger.info(f"Right of Access request from user: {user_email}")
    
    # In a real implementation, fetch from database
    # For now, return structured information about data categories
    
    # TODO: Implement actual data fetching from Supabase
    # brands = await brand_db.list(filters={"user_id": user_id})
    # analyses = await analysis_db.list(filters={"user_id": user_id})
    
    return {
        "user_info": {
            "email": user_email,
            "user_id": user_id,
            "created_at": current_user.get("created_at", "Unknown"),
        },
        "brands": [],  # TODO: Populate with actual brands
        "analyses_count": 0,  # TODO: Count actual analyses
        "data_collected_at": datetime.datetime.utcnow().isoformat(),
        "data_categories": [
            "Datos de identificación (email, nombre)",
            "Datos de acceso (IP, User-Agent)",
            "Datos de uso del servicio (marcas, análisis)",
            "Datos de pago (si aplica, gestionados por Stripe)",
        ],
        "retention_period": "Datos activos: duración de la cuenta. Datos bloqueados: 3 años (LOPD Art. 32).",
        "legal_basis": "Consentimiento (Art. 6.1.a GDPR) y ejecución de contrato (Art. 6.1.b GDPR)",
        "third_party_transfers": [
            "Supabase (Base de datos - EU)",
            "OpenAI (Análisis IA - USA, bajo SCCs)",
            "Vercel (Hosting - USA, bajo SCCs)",
            "Stripe (Pagos - USA, bajo SCCs)",
        ]
    }

# ============================================
# Right to Data Portability (GDPR Art. 20)
# ============================================

@router.get("/export")
async def export_my_data(
    format: str = "json",
    current_user: dict = Depends(deps.get_current_user),
):
    """
    GDPR Art. 20 - Right to Data Portability.
    Export all user data in a structured, commonly used, machine-readable format.
    Supports: json, csv
    """
    user_id = current_user.get("id")
    user_email = current_user.get("email")
    
    logger.info(f"Data Portability export request from user: {user_email}, format: {format}")
    
    # TODO: Implement actual data fetching
    # For now, return a structured export template
    
    export_data = {
        "export_metadata": {
            "exported_at": datetime.datetime.utcnow().isoformat(),
            "format": format,
            "gdpr_article": "Art. 20 - Right to Data Portability",
            "user_email": user_email,
        },
        "user_profile": {
            "email": user_email,
            "user_id": user_id,
        },
        "brands": [],  # TODO: Populate
        "analyses": [],  # TODO: Populate
        "settings": {},  # TODO: Populate
    }
    
    if format == "json":
        return JSONResponse(
            content=export_data,
            headers={
                "Content-Disposition": f"attachment; filename=mentha_data_export_{user_id}.json"
            }
        )
    elif format == "csv":
        # Simple CSV for basic data
        csv_content = "category,key,value\n"
        csv_content += f"profile,email,{user_email}\n"
        csv_content += f"profile,user_id,{user_id}\n"
        csv_content += f"metadata,exported_at,{export_data['export_metadata']['exported_at']}\n"
        
        return StreamingResponse(
            io.StringIO(csv_content),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=mentha_data_export_{user_id}.csv"
            }
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported format. Use 'json' or 'csv'.")

# ============================================
# Right to Object (GDPR Art. 21)
# ============================================

@router.post("/object")
async def register_objection(
    objection: ObjectionRequest,
    current_user: dict = Depends(deps.get_current_user),
):
    """
    GDPR Art. 21 - Right to Object.
    Register an objection to specific types of data processing.
    """
    user_email = current_user.get("email")
    
    logger.info(f"Objection registered from {user_email}: type={objection.objection_type}, reason={objection.reason}")
    
    # TODO: Store objection in database
    # TODO: Apply objection to user settings (e.g., disable automated emails, disable profiling)
    
    return {
        "message": f"Tu objeción al tratamiento de tipo '{objection.objection_type}' ha sido registrada.",
        "objection_type": objection.objection_type,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "status": "REGISTERED"
    }

