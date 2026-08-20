import gc
import os
import json
import whisperx
from whisperx.diarize import DiarizationPipeline
from dotenv import load_dotenv

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")

def transcribe_audio(
    audio_path,
    hf_token=None,
    device="cpu",
    compute_type="int8",
    model_size="large-v2",
    batch_size=16,
    min_speaker=None,
    max_speaker=None,
):
    if not os.path.isfile(audio_path):
        raise FileNotFoundError

    audio = whisperx.load_audio(audio_path)

    model = whisperx.load_model(model_size, device, compute_type = compute_type)
    result = model.transcribe(audio, batch_size=batch_size)

    detected_lang = result["language"]

    del model
    gc.collect()


    model_a, metadata = whisperx.load_align_model(language_code=detected_lang, device=device)

    result = whisperx.align(result["segments"], model_a, metadata, audio, device, return_char_alignments=False)

    del model_a
    gc.collect()

    if hf_token:
        diarize_model = DiarizationPipeline(token=hf_token, device=device)
        diarize_segments = diarize_model(
            audio, min_speakers=min_speaker, max_speakers=max_speaker
        )
        result = whisperx.assign_word_speakers(diarize_segments, result)

    segments_out = []

    for seg in result["segments"]:
        segments_out.append({
            "start":seg.get("start"),
            "end":seg.get("end"),
            "speaker":seg.get("speaker", "UNKNOWN"),
            "text":seg["text"].strip(),
        })

    full_text = " ".join(seg["text"] for seg in segments_out)

    return {
        "text" : full_text,
        "language" : detected_lang,
        "segments" : segments_out
    }


if __name__ == "__main__":
    transcribed_text = transcribe_audio(
        "./files/test_audio.mp3",
        hf_token=HF_TOKEN,
        device="cpu",
        compute_type="int8",
        model_size="large-v2",
        batch_size=16,
        min_speaker=2,
        max_speaker=2,
    )
    with open("./files/transcribed_text.json", "w", encoding="utf-8") as f:
        json.dump(transcribed_text, f, indent=4, ensure_ascii=False)
