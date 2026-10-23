# backend/job_manager.py
import threading
import time
from typing import Dict, List

STAGE_NAMES = [
    "Media Extraction",
    "WhisperX Transcription",
    "PyAnnote Diarization",
    "NLLB-200 Translation",
    "Emotion Analysis",
    "XTTS-v2 Synthesis",
    "Timing Alignment",
    "Audio-Video Sync",
    "Final Rendering",
]


class Job:
    def __init__(self, job_id, project_name, filename, target_lang,
                 target_lang_name, file_size):
        self.id = job_id
        self.status = "queued"
        self.stage_index = 0
        self.stage_progresses = [0] * len(STAGE_NAMES)
        self.logs: List[str] = []
        self.error = None
        self.result_url = None
        self.audio_url = None
        self.transcript_url = None
        self.elapsed_seconds = 0
        self.cancel_requested = False

        self.project_name = project_name
        self.filename = filename
        self.target_lang = target_lang
        self.target_lang_name = target_lang_name
        self.file_size = file_size
        self.speakers = None
        self.emotion_score = None
        self.duration_seconds = None
        self.created_at = time.strftime("%Y-%m-%d %H:%M:%S")

    @property
    def progress(self) -> int:
        total = sum(self.stage_progresses)
        return min(100, int(total / (100 * len(self.stage_progresses)) * 100))

    def to_dict(self):
        return {
            "id": self.id,
            "status": self.status,
            "stage_index": self.stage_index,
            "stage_name": STAGE_NAMES[self.stage_index],
            "stage_progresses": self.stage_progresses,
            "progress": self.progress,
            "logs": self.logs[-200:],
            "elapsed_seconds": self.elapsed_seconds,
            "result_url": self.result_url,
            "audio_url": self.audio_url,
            "transcript_url": self.transcript_url,
            "error": self.error,
            "project_name": self.project_name,
            "target_lang": self.target_lang,
            "target_lang_name": self.target_lang_name,
            "speakers": self.speakers,
            "emotion_score": self.emotion_score,
            "duration_seconds": self.duration_seconds,
            "file_size": self.file_size,
            "created_at": self.created_at,
        }


class JobManager:
    def __init__(self):
        self._jobs: Dict[str, Job] = {}
        self._lock = threading.Lock()

    def create(self, job_id, project_name, filename, target_lang,
               target_lang_name, file_size) -> Job:
        with self._lock:
            job = Job(job_id, project_name, filename, target_lang,
                      target_lang_name, file_size)
            self._jobs[job_id] = job
            return job

    def get(self, job_id):
        return self._jobs.get(job_id)

    def list(self):
        return [j.to_dict() for j in sorted(
            self._jobs.values(), key=lambda x: x.created_at, reverse=True)]

    def log(self, job_id, msg: str):
        j = self._jobs.get(job_id)
        if j:
            j.logs.append(f"[{time.strftime('%H:%M:%S')}] {msg}")

    def set_stage(self, job_id, stage_index: int, progress_pct: int, msg: str = None):
        j = self._jobs.get(job_id)
        if not j:
            return
        j.stage_index = stage_index
        j.stage_progresses[stage_index] = max(0, min(100, progress_pct))
        if msg:
            j.logs.append(f"[{time.strftime('%H:%M:%S')}] {msg}")

    def set_metadata(self, job_id, **kwargs):
        j = self._jobs.get(job_id)
        if j:
            for k, v in kwargs.items():
                setattr(j, k, v)

    def complete(self, job_id, result_url, audio_url=None,
                 transcript_url=None, elapsed=0):
        j = self._jobs.get(job_id)
        if j:
            j.status = "completed"
            j.stage_index = len(STAGE_NAMES) - 1
            j.stage_progresses = [100] * len(STAGE_NAMES)
            j.result_url = result_url
            j.audio_url = audio_url
            j.transcript_url = transcript_url
            j.elapsed_seconds = elapsed
            j.logs.append(f"[{time.strftime('%H:%M:%S')}] [RENDER] Dubbing complete.")

    def fail(self, job_id, err: str):
        j = self._jobs.get(job_id)
        if j:
            j.status = "failed"
            j.error = err
            j.logs.append(f"[{time.strftime('%H:%M:%S')}] [ERROR] {err}")

    def cancel(self, job_id):
        j = self._jobs.get(job_id)
        if j:
            j.cancel_requested = True
            j.status = "cancelled"
            j.logs.append(f"[{time.strftime('%H:%M:%S')}] [CANCEL] Requested by user.")


jobs = JobManager()