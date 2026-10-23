# backend/pipeline_runner.py
# REAL Vocult pipeline: WhisperX -> NLLB -> Edge TTS -> aligned audio -> final MP4.
# Replaces the previous fake pipeline. Uses the Python environment running FastAPI,
# so that environment must have the packages imported below installed.

import asyncio
import json
import re
import subprocess
import time
from pathlib import Path

from .job_manager import jobs, STAGE_NAMES
from .languages import get_language

# This mirrors the working Emotion XTTS notebook's language setup.
# Note: the supplied notebook actually uses Edge TTS, not XTTS voice cloning.
LANGUAGES = {
    "hin_Deva": ("Hindi", "hi-IN-SwaraNeural"),
    "eng_Latn": ("English", "en-US-AriaNeural"),
    "spa_Latn": ("Spanish", "es-ES-ElviraNeural"),
    "fra_Latn": ("French", "fr-FR-DeniseNeural"),
    "deu_Latn": ("German", "de-DE-KatjaNeural"),
    "jpn_Jpan": ("Japanese", "ja-JP-NanamiNeural"),
    "zho_Hans": ("Chinese (Simplified)", "zh-CN-XiaoxiaoNeural"),
    "arb_Arab": ("Arabic", "ar-SA-ZariyahNeural"),
    "ben_Beng": ("Bengali", "bn-IN-TanishaaNeural"),
    "tam_Taml": ("Tamil", "ta-IN-PallaviNeural"),
    "tel_Telu": ("Telugu", "te-IN-ShrutiNeural"),
    "pan_Guru": ("Punjabi", "pa-IN-VaaniNeural"),
    "urd_Arab": ("Urdu", "ur-PK-UzmaNeural"),
}

NLLB_SOURCE_CODES = {
    "en": "eng_Latn", "hi": "hin_Deva", "es": "spa_Latn",
    "fr": "fra_Latn", "de": "deu_Latn", "ja": "jpn_Jpan",
    "zh": "zho_Hans", "ar": "arb_Arab", "bn": "ben_Beng",
    "ta": "tam_Taml", "te": "tel_Telu", "pa": "pan_Guru",
    "ur": "urd_Arab", "it": "ita_Latn", "pt": "por_Latn",
    "ru": "rus_Cyrl",
}

SAMPLE_RATE = 24000
WHISPER_MODEL = "small"
NLLB_MODEL = "facebook/nllb-200-distilled-600M"


def _check_cancel(job_id: str):
    job = jobs.get(job_id)
    if job and getattr(job, "cancel_requested", False):
        raise RuntimeError("Cancelled by user")


def _set_stage(job_id: str, index: int, pct: int, message: str = ""):
    # Use existing job manager API; log details so the frontend can show actual work.
    try:
        jobs.set_stage(job_id, index, pct)
    except Exception:
        pass
    if message:
        jobs.log(job_id, message)


async def run_pipeline(job_id: str, input_path: str, target_lang_code: str, opts: dict):
    """Generate a real translated MP4 and publish it through the existing /files mount."""
    start_time = time.time()
    input_video = Path(input_path).expanduser().resolve()
    job_dir = (Path("files") / "outputs" / job_id).resolve()
    job_dir.mkdir(parents=True, exist_ok=True)

    if not input_video.is_file():
        jobs.fail(job_id, f"Input video does not exist: {input_video}")
        return

    if target_lang_code not in LANGUAGES:
        lang = get_language(target_lang_code) or {}
        # Accept known NLLB codes only; fail clearly rather than silently outputting original.
        if target_lang_code not in LANGUAGES:
            jobs.fail(job_id, f"Unsupported target language code: {target_lang_code}")
            return

    language_name, voice = LANGUAGES[target_lang_code]
    jobs.set_metadata(job_id, target_lang=target_lang_code, target_lang_name=language_name)
    jobs.log(job_id, f"Real translation pipeline started: {input_video.name} -> {language_name}")

    try:
        # Heavy imports are delayed so the API can start and report dependency errors per job.
        import imageio_ffmpeg
        import numpy as np
        import soundfile as sf
        import torch
        import whisperx
        import edge_tts
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

        ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
        audio_path = job_dir / "original_audio.wav"
        transcript_path = job_dir / "transcript.json"
        translated_path = job_dir / "translated_transcript.json"
        dubbed_audio_path = job_dir / "translated_audio.wav"
        final_video = job_dir / f"{input_video.stem}_{target_lang_code}.mp4"

        device = "cuda" if torch.cuda.is_available() else "cpu"
        compute_type = "float16" if device == "cuda" else "int8"

        # Stage 1: extract audio
        _check_cancel(job_id)
        _set_stage(job_id, 0, 5, "Extracting original audio with FFmpeg")
        subprocess.run([
            ffmpeg, "-y", "-i", str(input_video), "-vn", "-ac", "1",
            "-ar", "16000", "-c:a", "pcm_s16le", str(audio_path)
        ], check=True, capture_output=True, text=True)
        _set_stage(job_id, 0, 100, "Original audio extracted")

        # Stage 2: transcribe with WhisperX
        _check_cancel(job_id)
        _set_stage(job_id, 1, 5, "Loading WhisperX speech-recognition model")
        audio = whisperx.load_audio(str(audio_path))
        asr_model = whisperx.load_model(
            WHISPER_MODEL, device=device, compute_type=compute_type
        )
        result = asr_model.transcribe(audio, batch_size=4 if device == "cuda" else 1)
        detected_language = result.get("language", "en")
        source_lang = NLLB_SOURCE_CODES.get(detected_language)
        if not source_lang:
            raise RuntimeError(
                f"WhisperX detected unsupported source language '{detected_language}'. "
                "Add its NLLB code to NLLB_SOURCE_CODES."
            )
        segments = []
        for i, item in enumerate(result.get("segments", [])):
            text = item.get("text", "").strip()
            if text:
                segments.append({
                    "id": i, "start": float(item["start"]),
                    "end": float(item["end"]), "text": text
                })
        if not segments:
            raise RuntimeError("WhisperX did not detect any speech.")
        transcript_path.write_text(
            json.dumps(segments, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        del asr_model
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        _set_stage(job_id, 1, 100, f"Transcribed {len(segments)} speech segments ({detected_language})")

        # Stage 3: translate using NLLB
        _check_cancel(job_id)
        _set_stage(job_id, 2, 5, "Loading NLLB translation model")
        tokenizer = AutoTokenizer.from_pretrained(NLLB_MODEL)
        translator = AutoModelForSeq2SeqLM.from_pretrained(NLLB_MODEL).to(device)
        translator.eval()
        tokenizer.src_lang = source_lang
        target_token_id = tokenizer.convert_tokens_to_ids(target_lang_code)

        translated_segments = []
        for i, segment in enumerate(segments):
            _check_cancel(job_id)
            inputs = tokenizer(
                segment["text"], return_tensors="pt", truncation=True, max_length=512
            ).to(device)
            with torch.no_grad():
                output = translator.generate(
                    **inputs, forced_bos_token_id=target_token_id,
                    max_new_tokens=256, num_beams=4
                )
            translated_text = tokenizer.batch_decode(
                output, skip_special_tokens=True
            )[0].strip()
            translated_segments.append({**segment, "translated_text": translated_text})
            progress = int((i + 1) * 100 / len(segments))
            _set_stage(job_id, 2, progress, f"Translated segment {i + 1}/{len(segments)}")
        translated_path.write_text(
            json.dumps(translated_segments, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        del translator, tokenizer
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        # Stage 4: generate speech per segment with Edge TTS (same as supplied notebook)
        _check_cancel(job_id)
        _set_stage(job_id, 3, 5, f"Generating {language_name} speech with voice {voice}")
        generated_segments = []
        for i, segment in enumerate(translated_segments):
            _check_cancel(job_id)
            text = segment["translated_text"].strip()
            if not text:
                continue
            mp3_path = job_dir / f"segment_{i:04d}.mp3"
            wav_path = job_dir / f"segment_{i:04d}.wav"
            await edge_tts.Communicate(text=text, voice=voice).save(str(mp3_path))
            subprocess.run([
                ffmpeg, "-y", "-i", str(mp3_path), "-ac", "1",
                "-ar", str(SAMPLE_RATE), "-c:a", "pcm_s16le", str(wav_path)
            ], check=True, capture_output=True, text=True)
            speech, sr = sf.read(str(wav_path), dtype="float32")
            if speech.ndim > 1:
                speech = speech.mean(axis=1)
            # Resample if ffmpeg unexpectedly produced a different rate.
            if sr != SAMPLE_RATE:
                raise RuntimeError(f"Unexpected audio sample rate {sr}; expected {SAMPLE_RATE}.")
            generated_segments.append({
                "start": segment["start"], "end": segment["end"], "audio": speech
            })
            _set_stage(
                job_id, 3, int((i + 1) * 100 / max(1, len(translated_segments))),
                f"Generated speech {i + 1}/{len(translated_segments)}"
            )
        if not generated_segments:
            raise RuntimeError("TTS did not generate any translated speech.")

        # Stage 5: align speech on the original timeline
        _check_cancel(job_id)
        _set_stage(job_id, 4, 10, "Aligning generated speech to the video timeline")
        probe = subprocess.run(
            [ffmpeg, "-hide_banner", "-i", str(input_video)],
            capture_output=True, text=True
        )
        match = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", probe.stderr)
        if not match:
            raise RuntimeError("Could not determine input video duration.")
        duration = int(match.group(1)) * 3600 + int(match.group(2)) * 60 + float(match.group(3))
        total_samples = int(duration * SAMPLE_RATE)
        timeline = np.zeros(total_samples, dtype=np.float32)
        for item in generated_segments:
            _check_cancel(job_id)
            start_sample = max(0, int(item["start"] * SAMPLE_RATE))
            speech = item["audio"]
            if start_sample >= total_samples:
                continue
            end_sample = min(start_sample + len(speech), total_samples)
            timeline[start_sample:end_sample] += speech[:end_sample - start_sample]
        peak = float(np.max(np.abs(timeline))) if len(timeline) else 0.0
        if peak > 0.99:
            timeline *= 0.99 / peak
        sf.write(str(dubbed_audio_path), timeline, SAMPLE_RATE)
        _set_stage(job_id, 4, 100, "Translated audio aligned to original timeline")

        # Mark unused intermediate stages as complete only after the real corresponding
        # work above succeeded; don't emit FAKE messages.
        for idx in range(5, min(len(STAGE_NAMES), 8)):
            _check_cancel(job_id)
            _set_stage(job_id, idx, 20, f"Preparing final video (stage: {STAGE_NAMES[idx]})")

        # Stage 6: mux translated audio with source video.
        _check_cancel(job_id)
        _set_stage(job_id, 8 if len(STAGE_NAMES) > 8 else 5, 10, "Rendering final MP4 with FFmpeg")
        subprocess.run([
            ffmpeg, "-y", "-i", str(input_video), "-i", str(dubbed_audio_path),
            "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
            "-c:a", "aac", "-b:a", "192k", "-t", str(duration),
            "-movflags", "+faststart", str(final_video)
        ], check=True, capture_output=True, text=True)

        if not final_video.is_file() or final_video.stat().st_size == 0:
            raise RuntimeError("Final translated MP4 was not created.")
        # Ensure any remaining progress bars are completed after successful render.
        for idx in range(len(STAGE_NAMES)):
            try:
                current_job = jobs.get(job_id)
                stages = getattr(current_job, "stages", [])
                if idx >= len(stages) or getattr(stages[idx], "progress", 0) < 100:
                    jobs.set_stage(job_id, idx, 100)
            except Exception:
                pass

        result_url = f"/files/outputs/{job_id}/{final_video.name}"
        audio_url = f"/files/outputs/{job_id}/{dubbed_audio_path.name}"
        transcript_url = f"/files/outputs/{job_id}/{translated_path.name}"
        jobs.log(job_id, f"REAL translation completed: {final_video} ({final_video.stat().st_size} bytes)")
        jobs.complete(
            job_id,
            result_url=result_url,
            audio_url=audio_url,
            transcript_url=transcript_url,
            elapsed=int(time.time() - start_time),
        )

    except Exception as exc:
        import traceback
        traceback.print_exc()
        jobs.log(job_id, f"Translation failed: {type(exc).__name__}: {exc}")
        jobs.fail(job_id, f"{type(exc).__name__}: {exc}")
