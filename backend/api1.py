# backend/api.py
import uuid
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .languages import NLLB_LANGUAGES, get_language
from .job_manager import jobs
from .pipeline_runner import run_pipeline
from .schemas import JobResponse


app = FastAPI(title="Vocult API", version="1.0.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


BASE = Path("files")
BASE.mkdir(exist_ok=True)
(BASE / "uploads").mkdir(exist_ok=True)
(BASE / "outputs").mkdir(exist_ok=True)
app.mount("/files", StaticFiles(directory=str(BASE)), name="files")


# ---------------------------------------------------------------------------
# Health / languages
# ---------------------------------------------------------------------------
@app.get("/api/health")
def health():
    return {"status": "ok", "engine": "XTTS-v2 + NLLB-200"}


@app.get("/api/languages")
def list_languages():
    return NLLB_LANGUAGES


# ---------------------------------------------------------------------------
# Create job
# ---------------------------------------------------------------------------
@app.post("/api/jobs")
async def create_job(
    background: BackgroundTasks,
    file: UploadFile = File(...),
    target_lang: str = Form(...),
    source_lang: str = Form("auto"),
    voice_type: str = Form("Auto Speaker Clone"),
    voice_style: str = Form("Natural (Default)"),
    preserve_emotion: bool = Form(True),
    preserve_identity: bool = Form(True),
    subtitles: bool = Form(True),
    bgm: bool = Form(True),
    diarize: bool = Form(True),
    project_name: str = Form("Untitled"),
):
    lang = get_language(target_lang)
    if lang is None:
        raise HTTPException(400, f"Unknown target language: {target_lang}")

    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    allowed = {"mp4", "mov", "mkv", "webm", "mp3", "wav", "m4a", "aac", "flac"}
    if ext not in allowed:
        raise HTTPException(400, f"Unsupported file type: .{ext}")

    job_id = uuid.uuid4().hex[:12]
    upload_path = BASE / "uploads" / f"{job_id}_{file.filename}"

    size_bytes = 0
    with open(upload_path, "wb") as f:
        while chunk := await file.read(1 << 20):
            f.write(chunk)
            size_bytes += len(chunk)

    jobs.create(
        job_id=job_id,
        project_name=project_name,
        filename=file.filename,
        target_lang=target_lang,
        target_lang_name=lang["name"],
        file_size=f"{size_bytes / (1024 * 1024):.1f} MB",
    )
    jobs.log(job_id, f"Uploaded {file.filename} ({size_bytes/1024/1024:.1f} MB)")

    opts = {
        "source_lang": source_lang,
        "voice_type": voice_type,
        "voice_style": voice_style,
        "preserve_emotion": preserve_emotion,
        "preserve_identity": preserve_identity,
        "subtitles": subtitles,
        "bgm": bgm,
        "diarize": diarize,
    }

    background.add_task(_run_safe, job_id, str(upload_path), target_lang, opts)
    return {"job_id": job_id}


async def _run_safe(job_id, input_path, target_lang, opts):
    try:
        await run_pipeline(job_id, input_path, target_lang, opts)
    except Exception as e:
        import traceback
        traceback.print_exc()
        jobs.fail(job_id, str(e))


# ---------------------------------------------------------------------------
# List / fetch jobs
# ---------------------------------------------------------------------------
@app.get("/api/jobs")
def list_jobs():
    return jobs.list()


@app.get("/api/jobs/{job_id}", response_model=JobResponse)
def get_job(job_id: str):
    j = jobs.get(job_id)
    if not j:
        raise HTTPException(404, "Job not found")
    return j.to_dict()


# ---------------------------------------------------------------------------
# Cancel job  (supports BOTH methods/paths the frontend may use)
# ---------------------------------------------------------------------------
@app.post("/api/jobs/{job_id}/cancel")
def cancel_job_post(job_id: str):
    j = jobs.get(job_id)
    if not j:
        raise HTTPException(404, "Job not found")
    jobs.cancel(job_id)
    return {"ok": True, "job_id": job_id}


@app.delete("/api/jobs/{job_id}")
def cancel_job_delete(job_id: str):
    j = jobs.get(job_id)
    if not j:
        raise HTTPException(404, "Job not found")
    jobs.cancel(job_id)
    return {"ok": True, "job_id": job_id}


# ---------------------------------------------------------------------------
# Download
# ---------------------------------------------------------------------------
@app.get("/api/jobs/{job_id}/download")
def download(job_id: str):
    j = jobs.get(job_id)
    if not j or not j.result_url:
        raise HTTPException(404, "Result not ready")
    rel = j.result_url.replace("/files/", "")
    full = BASE / rel
    if not full.exists():
        raise HTTPException(404, "File missing on disk")
    return FileResponse(str(full), filename=full.name)