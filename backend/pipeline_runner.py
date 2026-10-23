# backend/pipeline_runner.py — PHASE 1 (FAKE)
# Replace with real workers in Phase 2.
import asyncio
import time
import shutil
from pathlib import Path

from .job_manager import jobs, STAGE_NAMES
from .languages import get_language


async def run_pipeline(job_id: str, input_path: str, target_lang_code: str, opts: dict):
    start = time.time()
    lang = get_language(target_lang_code) or {"name": target_lang_code}

    jobs.set_metadata(job_id, target_lang=target_lang_code,
                      target_lang_name=lang["name"])
    jobs.log(job_id, f"Pipeline start — target: {lang['name']} ({target_lang_code})")

    job_dir = Path("files/outputs") / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    try:
        for i, name in enumerate(STAGE_NAMES):
            if jobs.get(job_id).cancel_requested:
                jobs.fail(job_id, "Cancelled by user")
                return
            jobs.log(job_id, f"[{i+1}/9] {name} — running (FAKE)")
            for pct in range(10, 101, 10):
                jobs.set_stage(job_id, i, pct)
                await asyncio.sleep(0.15)
            jobs.log(job_id, f"[{i+1}/9] {name} — done (FAKE)")

        fake_result = job_dir / Path(input_path).name
        shutil.copy(input_path, fake_result)

        jobs.complete(
            job_id,
            result_url=f"/files/outputs/{job_id}/{fake_result.name}",
            audio_url=None,
            transcript_url=None,
            elapsed=int(time.time() - start),
        )
    except Exception as e:
        import traceback; traceback.print_exc()
        jobs.fail(job_id, f"{type(e).__name__}: {e}")