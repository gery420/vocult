# backend/languages.py
# NLLB-200 language catalogue. Keep in sync with the frontend's NLLB_LANGUAGES array.
# xtts_code  = 2-letter code XTTS-v2 accepts
# edge_voice = fallback voice for edge-tts (used when XTTS doesn't support the language)

NLLB_LANGUAGES = [
    {"code": "eng_Latn", "name": "English",              "script": "Latin",              "xtts_code": "en", "edge_voice": "en-US-AriaNeural"},
    {"code": "hin_Deva", "name": "Hindi",                "script": "Devanagari",         "xtts_code": "hi", "edge_voice": "hi-IN-SwaraNeural"},
    {"code": "spa_Latn", "name": "Spanish",              "script": "Latin",              "xtts_code": "es", "edge_voice": "es-ES-ElviraNeural"},
    {"code": "fra_Latn", "name": "French",               "script": "Latin",              "xtts_code": "fr", "edge_voice": "fr-FR-DeniseNeural"},
    {"code": "deu_Latn", "name": "German",               "script": "Latin",              "xtts_code": "de", "edge_voice": "de-DE-KatjaNeural"},
    {"code": "jpn_Jpan", "name": "Japanese",             "script": "Japanese",           "xtts_code": "ja", "edge_voice": "ja-JP-NanamiNeural"},
    {"code": "zho_Hans", "name": "Chinese (Simplified)", "script": "Simplified Chinese", "xtts_code": "zh", "edge_voice": "zh-CN-XiaoxiaoNeural"},
    {"code": "arb_Arab", "name": "Arabic",               "script": "Arabic",             "xtts_code": "ar", "edge_voice": "ar-SA-ZariyahNeural"},
    {"code": "por_Latn", "name": "Portuguese",           "script": "Latin",              "xtts_code": "pt", "edge_voice": "pt-BR-FranciscaNeural"},
    {"code": "ita_Latn", "name": "Italian",              "script": "Latin",              "xtts_code": "it", "edge_voice": "it-IT-ElsaNeural"},
    {"code": "rus_Cyrl", "name": "Russian",              "script": "Cyrillic",           "xtts_code": "ru", "edge_voice": "ru-RU-SvetlanaNeural"},
    {"code": "kor_Hang", "name": "Korean",               "script": "Hangul",             "xtts_code": "ko", "edge_voice": "ko-KR-SunHiNeural"},
    {"code": "nld_Latn", "name": "Dutch",                "script": "Latin",              "xtts_code": "nl", "edge_voice": "nl-NL-ColetteNeural"},
    {"code": "pol_Latn", "name": "Polish",               "script": "Latin",              "xtts_code": "pl", "edge_voice": "pl-PL-ZofiaNeural"},
    {"code": "tur_Latn", "name": "Turkish",              "script": "Latin",              "xtts_code": "tr", "edge_voice": "tr-TR-EmelNeural"},
    {"code": "swe_Latn", "name": "Swedish",              "script": "Latin",              "xtts_code": "sv", "edge_voice": "sv-SE-SofieNeural"},
    {"code": "pan_Guru", "name": "Punjabi",              "script": "Gurmukhi",           "xtts_code": "pa", "edge_voice": "pa-IN-VaaniNeural"},
    {"code": "ben_Beng", "name": "Bengali",              "script": "Bengali",            "xtts_code": "bn", "edge_voice": "bn-IN-TanishaaNeural"},
    {"code": "tam_Taml", "name": "Tamil",                "script": "Tamil",              "xtts_code": "ta", "edge_voice": "ta-IN-PallaviNeural"},
    {"code": "tel_Telu", "name": "Telugu",               "script": "Telugu",             "xtts_code": "te", "edge_voice": "te-IN-ShrutiNeural"},
    {"code": "mar_Deva", "name": "Marathi",              "script": "Devanagari",         "xtts_code": "mr", "edge_voice": "mr-IN-AarohiNeural"},
    {"code": "ukr_Cyrl", "name": "Ukrainian",            "script": "Cyrillic",           "xtts_code": "uk", "edge_voice": "uk-UA-PolinaNeural"},
    {"code": "vie_Latn", "name": "Vietnamese",           "script": "Latin",              "xtts_code": "vi", "edge_voice": "vi-VN-HoaiMyNeural"},
    {"code": "ind_Latn", "name": "Indonesian",           "script": "Latin",              "xtts_code": "id", "edge_voice": "id-ID-GadisNeural"},
    {"code": "urd_Arab", "name": "Urdu",                 "script": "Arabic",             "xtts_code": "ur", "edge_voice": "ur-PK-UzmaNeural"},
    {"code": "pes_Arab", "name": "Persian (Farsi)",      "script": "Arabic",             "xtts_code": "fa", "edge_voice": "fa-IR-DilaraNeural"},
    {"code": "ell_Grek", "name": "Greek",                "script": "Greek",              "xtts_code": "el", "edge_voice": "el-GR-AthinaNeural"},
    {"code": "ces_Latn", "name": "Czech",                "script": "Latin",              "xtts_code": "cs", "edge_voice": "cs-CZ-VlastaNeural"},
    {"code": "hun_Latn", "name": "Hungarian",            "script": "Latin",              "xtts_code": "hu", "edge_voice": "hu-HU-NoemiNeural"},
    {"code": "ron_Latn", "name": "Romanian",             "script": "Latin",              "xtts_code": "ro", "edge_voice": "ro-RO-AlinaNeural"},
    {"code": "tha_Thai", "name": "Thai",                 "script": "Thai",               "xtts_code": "th", "edge_voice": "th-TH-PremwadeeNeural"},
    {"code": "cat_Latn", "name": "Catalan",              "script": "Latin",              "xtts_code": "ca", "edge_voice": "ca-ES-JoanaNeural"},
    {"code": "dan_Latn", "name": "Danish",               "script": "Latin",              "xtts_code": "da", "edge_voice": "da-DK-ChristelNeural"},
    {"code": "fin_Latn", "name": "Finnish",              "script": "Latin",              "xtts_code": "fi", "edge_voice": "fi-FI-NooraNeural"},
    {"code": "nob_Latn", "name": "Norwegian",            "script": "Latin",              "xtts_code": "no", "edge_voice": "nb-NO-PernilleNeural"},
    {"code": "heb_Hebr", "name": "Hebrew",               "script": "Hebrew",             "xtts_code": "he", "edge_voice": "he-IL-HilaNeural"},
    {"code": "msa_Latn", "name": "Malay",                "script": "Latin",              "xtts_code": "ms", "edge_voice": "ms-MY-YasminNeural"},
    {"code": "slv_Latn", "name": "Slovenian",            "script": "Latin",              "xtts_code": "sl", "edge_voice": "sl-SI-PetraNeural"},
    {"code": "srp_Cyrl", "name": "Serbian",              "script": "Cyrillic",           "xtts_code": "sr", "edge_voice": "sr-RS-SophieNeural"},
    {"code": "kat_Geor", "name": "Georgian",             "script": "Georgian",           "xtts_code": "ka", "edge_voice": "ka-GE-EkaNeural"},
    {"code": "hye_Armn", "name": "Armenian",             "script": "Armenian",           "xtts_code": "hy", "edge_voice": "hy-AM-AnahitNeural"},
    {"code": "swa_Latn", "name": "Swahili",              "script": "Latin",              "xtts_code": "sw", "edge_voice": "sw-KE-ZuriNeural"},
    {"code": "kan_Knda", "name": "Kannada",              "script": "Kannada",            "xtts_code": "kn", "edge_voice": "kn-IN-SapnaNeural"},
    {"code": "mal_Mlym", "name": "Malayalam",            "script": "Malayalam",          "xtts_code": "ml", "edge_voice": "ml-IN-SobhanaNeural"},
    {"code": "guj_Gujr", "name": "Gujarati",             "script": "Gujarati",           "xtts_code": "gu", "edge_voice": "gu-IN-DhwaniNeural"},
    {"code": "mri_Latn", "name": "Maori",                "script": "Latin",              "xtts_code": "mi", "edge_voice": "en-NZ-MollyNeural"},
    {"code": "afr_Latn", "name": "Afrikaans",            "script": "Latin",              "xtts_code": "af", "edge_voice": "af-ZA-AdriNeural"},
    {"code": "isl_Latn", "name": "Icelandic",            "script": "Latin",              "xtts_code": "is", "edge_voice": "is-IS-GudrunNeural"},
]


def get_language(nllb_code: str):
    for lang in NLLB_LANGUAGES:
        if lang["code"] == nllb_code:
            return lang
    return None