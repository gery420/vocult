from audio_extractor_worker import audio_extractor
from transcribe_audio_worker import transcribe_audio
from translate_text_worker import translate_text
from dotenv import load_dotenv
import os
import torch

load_dotenv()

SOURCE_FILE_NAME = "test" #exclude the extension

INPUT_VIDEO_PATH = f"./files/{SOURCE_FILE_NAME}.mp4"
OUTPUT_DIRS = "./files"

INPUT_AUDIO_PATH = f"./files/{SOURCE_FILE_NAME}_audio.mp3"
HF_TOKEN = os.getenv("HF_TOKEN")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
COMPUTE_TYPE = "float16" if torch.cuda.is_available() else "int8"
TRANSCRIBTION_MODEL = "large-v2"
TRANSCRIBE_BATCH_SIZE = 16
MIN_SPEAKER = 0 #subject to change
MAX_SPEAKER = 2 #subject to change

INPUT_JSON_PATH = f"./files/{SOURCE_FILE_NAME}_audio_text.json"
TARGET_LANGUAGE = "hindi" #subject to change
"""

Supported Language -->

"english"
"hindi"
"french"
"german"
"spanish"
"japanese",
"korean",
"arabic",
"marathi",
"tamil",
"telugu",
"bengali",
"urdu",
"portuguese"
"russian",
"italian"
"dutch"
"polish"
"turkish"
"vietnamese"
"""

TRANSLATE_MODEL_NAME = "facebook/nllb-200-distilled-600M"
TRANSLATE_BATCH_SIZE = 4
MAX_LEN = 300

if os.path.exists(f"./files/{SOURCE_FILE_NAME}_audio.mp3"):
    pass
else:
    audio_extractor(input_path=INPUT_VIDEO_PATH, output_folder=OUTPUT_DIRS)

if os.path.exists(f"./files/{SOURCE_FILE_NAME}_audio_text.json"):
    pass
else:
    transcribe_audio(
        audio_path=INPUT_AUDIO_PATH,
        hf_token=HF_TOKEN,
        device=DEVICE,
        compute_type=COMPUTE_TYPE,
        model_size=TRANSCRIBTION_MODEL,
        batch_size=TRANSCRIBE_BATCH_SIZE,
        min_speaker=MIN_SPEAKER,
        max_speaker=MAX_SPEAKER    
    )
if os.path.exists(f"./files/{SOURCE_FILE_NAME}_audio_text_translated.json"):
    pass
else:        
    translate_text(
        input_json_path=INPUT_JSON_PATH,
        target_language=TARGET_LANGUAGE,
        output_json_path=None,
        model_name=TRANSLATE_MODEL_NAME,
        device=DEVICE,
        batch_size=TRANSLATE_BATCH_SIZE,
        max_length=MAX_LEN
    )
