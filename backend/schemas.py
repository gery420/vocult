# backend/schemas.py
from pydantic import BaseModel
from typing import Optional, List


class JobResponse(BaseModel):
    id: str
    status: str
    stage_index: int
    stage_name: str
    stage_progresses: List[int]
    progress: int
    logs: List[str]
    elapsed_seconds: int
    result_url: Optional[str] = None
    audio_url: Optional[str] = None
    transcript_url: Optional[str] = None
    error: Optional[str] = None
    project_name: Optional[str] = None
    target_lang: Optional[str] = None
    target_lang_name: Optional[str] = None
    speakers: Optional[int] = None
    emotion_score: Optional[str] = None
    duration_seconds: Optional[float] = None
    file_size: Optional[str] = None
    created_at: Optional[str] = None