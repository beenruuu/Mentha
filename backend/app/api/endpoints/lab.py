from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from app.services.generation.content_generator import get_content_generator

router = APIRouter()

class LabRequest(BaseModel):
    tool: str # 'definition', 'structure', 'entity'
    text: str # Input text or term
    context: Optional[str] = "" 
    industry: Optional[str] = "General"

@router.post("/generate")
async def generate_lab_content(request: LabRequest):
    """
    Generate AEO-optimized content based on the selected tool.
    """
    generator = get_content_generator()
    
    try:
        if request.tool == "definition":
            return await generator.generate_definition(term=request.text, context=request.context)
        
        elif request.tool == "structure":
            return await generator.structure_content(text=request.text)
            
        elif request.tool == "entity":
            return await generator.enrich_entities(content=request.text, industry=request.industry)
            
        else:
            raise HTTPException(status_code=400, detail="Invalid tool specified")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
