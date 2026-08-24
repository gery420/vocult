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

# ============================================================================
# Language Mapping
# ============================================================================

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

# Reverse mapping for display
NLLB_TO_USER = {v: k for k, v in USER_TO_NLLB.items()}

# ============================================================================
# Helper Functions
# ============================================================================

def get_supported_languages() -> str:
    """Return a formatted string of supported languages."""
    return ", ".join(sorted(USER_TO_NLLB.keys()))

def get_language_from_user(prompt: str = "Enter target language") -> str:
    """
    Interactively get language from user with validation.
    
    Args:
        prompt: Prompt message to display
        
    Returns:
        Validated target language (NLLB code)
    """
    print("\n" + "=" * 60)
    print("SUPPORTED LANGUAGES:")
    print("-" * 60)
    
    # Display languages in columns
    languages = sorted(USER_TO_NLLB.keys())
    for i in range(0, len(languages), 4):
        row = languages[i:i+4]
        print("  " + "  ".join(f"{lang:15}" for lang in row))
    
    print("-" * 60)
    print("Or enter an NLLB code directly (e.g., 'hin_Deva', 'eng_Latn')")
    print("=" * 60)
    
    while True:
        user_input = input(f"\n{prompt}: ").strip().lower()
        
        if not user_input:
            print("❌ Language cannot be empty. Please try again.")
            continue
        
        # Check if it's a user-friendly name
        if user_input in USER_TO_NLLB:
            return USER_TO_NLLB[user_input]
        
        # Check if it's already an NLLB code
        if user_input in WHISPER_TO_NLLB.values():
            return user_input
        
        # Check if it's a whisper code
        if user_input in WHISPER_TO_NLLB:
            print(f" Did you mean '{WHISPER_TO_NLLB[user_input]}'? Please enter the full NLLB code or user-friendly name.")
            continue
        
        print(f"Unsupported language: '{user_input}'")
        print(f"   Supported: {get_supported_languages()}")
        print("   Or use NLLB codes like 'hin_Deva', 'eng_Latn', etc.")

def get_input_file_from_user() -> str:
    """Interactively get input file path."""
    default = "./files/transcribed_text.json"
    print(f"\n📁 Input JSON file path (default: {default})")
    user_input = input("Path: ").strip()
    return user_input if user_input else default

def get_output_file_from_user() -> Optional[str]:
    """Interactively get output file path."""
    default = "./files/translated_text.json"
    print(f"\n💾 Output JSON file path (default: {default})")
    print("   Press Enter to use default")
    user_input = input("Path: ").strip()
    return user_input if user_input else default

# ============================================================================
# Translation Worker
# ============================================================================

def translate_audio(
    input_json_path: str,
    target_language: str,
    output_json_path: Optional[str] = None,
    model_name: str = "facebook/nllb-200-distilled-600M",
    device: Optional[str] = None,
    batch_size: int = 4,
    max_length: int = 200,
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
    
    # ------------------------------------------------------------------------
    # 1. Input Validation
    # ------------------------------------------------------------------------
    
    if not os.path.isfile(input_json_path):
        raise FileNotFoundError(
            f"Input JSON not found: {input_json_path}"
        )
    
    # ------------------------------------------------------------------------
    # 2. Load JSON
    # ------------------------------------------------------------------------
    
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
        logger.info("⏳ This may take a few minutes on first run (downloading model)...")
        
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
        
        logger.info("✅ Model loaded successfully")
        
    except Exception as e:
        raise RuntimeError(f"Failed to load NLLB model: {e}")
    
    # ------------------------------------------------------------------------
    # 6. Batch Translation
    # ------------------------------------------------------------------------
    
    logger.info(f"Translating {len(segments)} segments with batch_size={batch_size}")
    print("\n🔄 Translating...")
    
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
    logger.info("✅ All segments translated")
    
    # ------------------------------------------------------------------------
    # 7. Prepare Output
    # ------------------------------------------------------------------------
    
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
    
    # ------------------------------------------------------------------------
    # 8. Save Output
    # ------------------------------------------------------------------------
    
    if output_json_path is None:
        base_name = os.path.splitext(input_json_path)[0]
        output_json_path = f"{base_name}_translated.json"
    
    try:
        with open(output_json_path, "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=4, ensure_ascii=False)
        logger.info(f"✅ Saved translations to: {output_json_path}")
    except Exception as e:
        logger.error(f"Failed to save output: {e}")
        raise
    
    # ------------------------------------------------------------------------
    # 9. Cleanup
    # ------------------------------------------------------------------------
    
    del model
    del tokenizer
    gc.collect()
    
    if device == "cuda":
        torch.cuda.empty_cache()
    
    logger.info("Translation complete")
    
    return output_data


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import sys
    import argparse
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(
        description="Translate audio transcriptions using NLLB",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
Examples:
  # Interactive mode (recommended)
  python translate_audio_worker.py
  
  # Specify language directly
  python translate_audio_worker.py --target hindi
  
  # Specify all options
  python translate_audio_worker.py --input ./files/transcribed_text.json --target spanish --output ./files/translated_es.json
  
Supported languages: {get_supported_languages()}
        """
    )
    
    parser.add_argument(
        "--input", "-i",
        type=str,
        help="Input JSON file path (default: ./files/transcribed_text.json)"
    )
    
    parser.add_argument(
        "--target", "-t",
        type=str,
        help="Target language (e.g., hindi, spanish, or NLLB code like hin_Deva)"
    )
    
    parser.add_argument(
        "--output", "-o",
        type=str,
        help="Output JSON file path (default: auto-generated)"
    )
    
    parser.add_argument(
        "--device", "-d",
        type=str,
        choices=["cpu", "cuda"],
        help="Device to use (default: auto-detect)"
    )
    
    parser.add_argument(
        "--batch-size", "-b",
        type=int,
        default=4,
        help="Batch size for translation (default: 4)"
    )
    
    parser.add_argument(
        "--non-interactive", "-n",
        action="store_true",
        help="Run in non-interactive mode (requires --target to be set)"
    )
    
    args = parser.parse_args()
    
    try:
        # --- Interactive input gathering ---
        
        # Get input file
        input_path = args.input
        if not input_path:
            input_path = get_input_file_from_user()
        
        # Get target language
        target_lang = args.target
        if not target_lang:
            if args.non_interactive:
                print("❌ Error: --target is required in non-interactive mode")
                print(f"   Supported languages: {get_supported_languages()}")
                sys.exit(1)
            target_lang = get_language_from_user()
        else:
            # Validate target language
            if target_lang.lower() not in USER_TO_NLLB and target_lang not in WHISPER_TO_NLLB.values():
                print(f"❌ Error: Unsupported language '{target_lang}'")
                print(f"   Supported languages: {get_supported_languages()}")
                print("   Or use NLLB codes like 'hin_Deva', 'eng_Latn'")
                sys.exit(1)
        
        # Get output file
        output_path = args.output
        if not output_path:
            if args.non_interactive:
                # Auto-generate output path
                base_name = os.path.splitext(input_path)[0]
                output_path = f"{base_name}_translated.json"
            else:
                output_path = get_output_file_from_user()
        
        # --- Show summary before proceeding ---
        
        print("\n" + "=" * 60)
        print("📋 TRANSLATION SUMMARY")
        print("-" * 60)
        print(f"Input file:   {input_path}")
        print(f"Target:       {target_lang}")
        print(f"Output file:  {output_path}")
        print(f"Device:       {args.device or 'auto-detect'}")
        print(f"Batch size:   {args.batch_size}")
        print("=" * 60)
        
        # Confirm in interactive mode
        if not args.non_interactive and not args.target:
            confirm = input("\n✅ Proceed with translation? (y/n): ").strip().lower()
            if confirm not in ['y', 'yes']:
                print("❌ Translation cancelled.")
                sys.exit(0)
        
        # --- Run translation ---
        
        result = translate_audio(
            input_json_path=input_path,
            target_language=target_lang,
            output_json_path=output_path,
            device=args.device,
            batch_size=args.batch_size,
        )
        
        # --- Show final summary ---
        
        print("\n" + "=" * 60)
        print("✅ TRANSLATION COMPLETE!")
        print("-" * 60)
        print(f"Source:        {result['source_language']}")
        print(f"Target:        {result['target_language']}")
        print(f"Segments:      {len(result['segments'])}")
        print(f"Output saved:  {output_path}")
        print("=" * 60)
        
        # Show a sample of the translation
        if result['segments']:
            print("\n📝 Sample translation:")
            sample = result['segments'][0]
            print(f"  Original:  {sample['original_text'][:100]}...")
            print(f"  Translated: {sample['translated_text'][:100]}...")
        
    except KeyboardInterrupt:
        print("\n\n❌ Translation cancelled by user.")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Translation failed: {e}")
        sys.exit(1)