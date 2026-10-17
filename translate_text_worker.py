import gc
import json
import os
import torch
from typing import Dict, List, Optional, Any
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

WHISPER_TO_NLLB = {
    "en": "eng_Latn",
    "hi": "hin_Deva",
    "fr": "fra_Latn",
    "de": "deu_Latn",
    "es": "spa_Latn",
    "ja": "jpn_Jpan",
    "ko": "kor_Hang",
    "ar": "arb_Arab",
    "mr": "mar_Deva",
    "ta": "tam_Taml",
    "te": "tel_Telu",
    "bn": "ben_Beng",
    "ur": "urd_Arab",
    "pt": "por_Latn",
    "ru": "rus_Cyrl",
    "it": "ita_Latn",
    "nl": "nld_Latn",
    "pl": "pol_Latn",
    "tr": "tur_Latn",
    "vi": "vie_Latn",
}

# User-friendly language names to NLLB codes
USER_TO_NLLB = {
    "english": "eng_Latn",
    "hindi": "hin_Deva",
    "french": "fra_Latn",
    "german": "deu_Latn",
    "spanish": "spa_Latn",
    "japanese": "jpn_Jpan",
    "korean": "kor_Hang",
    "arabic": "arb_Arab",
    "marathi": "mar_Deva",
    "tamil": "tam_Taml",
    "telugu": "tel_Telu",
    "bengali": "ben_Beng",
    "urdu": "urd_Arab",
    "portuguese": "por_Latn",
    "russian": "rus_Cyrl",
    "italian": "ita_Latn",
    "dutch": "nld_Latn",
    "polish": "pol_Latn",
    "turkish": "tur_Latn",
    "vietnamese": "vie_Latn",
}

NLLB_TO_USER = {v: k for k, v in USER_TO_NLLB.items()}

def translate_text(
    input_json_path: str,
    target_language: str,
    output_json_path: Optional[str] = None,
    model_name: str = "facebook/nllb-200-distilled-600M",
    device: Optional[str] = None,
    batch_size: int = None,
    max_length: int = None,
) -> Dict[str, Any]:
    """
    Translate transcribed segments using NLLB.
    
    Args:
        input_json_path: Path to transcribed_text.json
        target_language: Target language (NLLB code like "hin_Deva" or user-friendly like "hindi")
        output_json_path: Path to save translated JSON (optional)
        model_name: NLLB model checkpoint
        device: "cpu" or "cuda" (auto-detects if None)
        batch_size: Number of segments to translate at once
        max_length: Maximum generation length
    
    Returns:
        Dictionary with translated data
    
    Raises:
        FileNotFoundError: If input JSON doesn't exist
        ValueError: If language mapping fails or no segments found
        RuntimeError: If translation fails
    """

    if not os.path.isfile(input_json_path):
        raise FileNotFoundError(
            f"Input JSON not found: {input_json_path}"
        )
    
    try:
        with open(input_json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in {input_json_path}: {e}")
    
    segments = data.get("segments", [])
    if not segments:
        raise ValueError("No segments found in input JSON")
    
    source_lang_whisper = data.get("language", "").lower()
    if not source_lang_whisper:
        raise ValueError("No language detected in input JSON")
    
    logger.info(f"Loaded {len(segments)} segments from {input_json_path}")
    logger.info(f"Detected source language: {source_lang_whisper}")
    
    # ------------------------------------------------------------------------
    # 3. Language Mapping
    # ------------------------------------------------------------------------
    
    # Map source language
    source_lang_nllb = WHISPER_TO_NLLB.get(source_lang_whisper)
    if not source_lang_nllb:
        raise ValueError(
            f"Unsupported source language: '{source_lang_whisper}'. "
            f"Supported: {list(WHISPER_TO_NLLB.keys())}"
        )
    
    # Map target language (support both NLLB codes and user-friendly names)
    target_lang_nllb = USER_TO_NLLB.get(target_language.lower())
    if not target_lang_nllb:
        # Check if it's already an NLLB code
        if target_language in WHISPER_TO_NLLB.values():
            target_lang_nllb = target_language
        else:
            raise ValueError(
                f"Unsupported target language: '{target_language}'. "
                f"Supported: {list(USER_TO_NLLB.keys())}"
            )
    
    # Get friendly names for display
    source_friendly = NLLB_TO_USER.get(source_lang_nllb, source_lang_nllb)
    target_friendly = NLLB_TO_USER.get(target_lang_nllb, target_lang_nllb)
    
    logger.info(f"Source: {source_friendly} ({source_lang_nllb})")
    logger.info(f"Target: {target_friendly} ({target_lang_nllb})")
    
    # ------------------------------------------------------------------------
    # 4. Device Setup
    # ------------------------------------------------------------------------
    
    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    
    logger.info(f"Using device: {device}")
    
    # ------------------------------------------------------------------------
    # 5. Load Model & Tokenizer
    # ------------------------------------------------------------------------
    
    try:
        logger.info(f"Loading NLLB model: {model_name}")
        logger.info("This may take a few minutes on first run (downloading model)...")
        
        tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            src_lang=source_lang_nllb,
            use_fast=False,  # NLLB uses SentencePiece
        )
        
        model = AutoModelForSeq2SeqLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            low_cpu_mem_usage=True,
        ).to(device)
        
        model.eval()
        
        # Set source language for tokenizer
        tokenizer.src_lang = source_lang_nllb
        
        logger.info("Model loaded successfully")
        
    except Exception as e:
        raise RuntimeError(f"Failed to load NLLB model: {e}")
    
    # ------------------------------------------------------------------------
    # 6. Batch Translation
    # ------------------------------------------------------------------------
    
    logger.info(f"Translating {len(segments)} segments with batch_size={batch_size}")
    print("\nTranslating...")
    
    translated_segments = []
    total_batches = (len(segments) + batch_size - 1) // batch_size
    
    for batch_idx in range(0, len(segments), batch_size):
        batch = segments[batch_idx:batch_idx + batch_size]
        
        # Extract texts
        texts = [seg["text"].strip() for seg in batch]
        
        # Tokenize batch
        inputs = tokenizer(
            texts,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=512,
        ).to(device)
        
        # Generate translations with forced target language
        with torch.no_grad():
            translated_tokens = model.generate(
                **inputs,
                forced_bos_token_id=tokenizer.convert_tokens_to_ids(target_lang_nllb),
                max_length=max_length,
                num_beams=4,
                early_stopping=True,
            )
        
        # Decode translations
        translations = tokenizer.batch_decode(
            translated_tokens,
            skip_special_tokens=True,
        )
        
        # Build translated segments
        for seg, translation in zip(batch, translations):
            translated_segments.append({
                "start": seg["start"],
                "end": seg["end"],
                "speaker": seg.get("speaker", "UNKNOWN"),
                "original_text": seg["text"].strip(),
                "translated_text": translation.strip(),
            })
        
        # Progress indicator
        progress = (batch_idx // batch_size + 1) / total_batches * 100
        print(f"  Progress: {progress:.0f}% ({batch_idx // batch_size + 1}/{total_batches} batches)", end="\r")
        logger.info(f"Completed batch {batch_idx // batch_size + 1}/{total_batches}")
    
    print()  # New line after progress
    logger.info("All segments translated")
    
    output_data = {
        "source_language": source_lang_nllb,
        "target_language": target_lang_nllb,
        "segments": translated_segments,
        "metadata": {
            "original_file": os.path.basename(input_json_path),
            "model": model_name,
            "num_segments": len(translated_segments),
        }
    }

    if output_json_path is None:
        base_name = os.path.splitext(input_json_path)[0]
        output_json_path = f"{base_name}_translated.json"
    
    try:
        with open(output_json_path, "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=4, ensure_ascii=False)
        logger.info(f"Saved translations to: {output_json_path}")
    except Exception as e:
        logger.error(f"Failed to save output: {e}")
        raise
    
    del model
    del tokenizer
    gc.collect()
    
    if device == "cuda":
        torch.cuda.empty_cache()
    
    logger.info("Translation complete")
    
    return output_data
