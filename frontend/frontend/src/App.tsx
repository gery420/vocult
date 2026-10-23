import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, Waves, Sparkles, FolderKanban, Settings, Upload, CheckCircle2,
  AlertCircle, Play, Pause, RefreshCw, X, Search, Sliders, Volume2,
  FileText, Download, Clock, Languages, ArrowRight, UserCheck, Shield,
  Layers, Check, ChevronDown, ChevronUp, Music, Cpu, Zap, Activity,
  Info, Trash2, ExternalLink, HelpCircle
} from 'lucide-react';

// ============ NEW IMPORTS FOR BACKEND ============
import { api } from './api/client';
// =================================================

// NLLB-200 LANGUAGE REGISTRY (same as before — keep your existing block)
const NLLB_LANGUAGES = [
  { code: 'eng_Latn', name: 'English', popular: true, countryCode: 'us', script: 'Latin' },
  { code: 'hin_Deva', name: 'Hindi', popular: true, countryCode: 'in', script: 'Devanagari' },
  { code: 'spa_Latn', name: 'Spanish', popular: true, countryCode: 'es', script: 'Latin' },
  { code: 'fra_Latn', name: 'French', popular: true, countryCode: 'fr', script: 'Latin' },
  { code: 'deu_Latn', name: 'German', popular: true, countryCode: 'de', script: 'Latin' },
  { code: 'jpn_Jpan', name: 'Japanese', popular: true, countryCode: 'jp', script: 'Japanese' },
  { code: 'zho_Hans', name: 'Chinese (Simplified)', popular: true, countryCode: 'cn', script: 'Simplified Chinese' },
  { code: 'arb_Arab', name: 'Arabic', popular: true, countryCode: 'sa', script: 'Arabic' },
  { code: 'por_Latn', name: 'Portuguese', popular: true, countryCode: 'br', script: 'Latin' },
  { code: 'ita_Latn', name: 'Italian', popular: true, countryCode: 'it', script: 'Latin' },
  { code: 'rus_Cyrl', name: 'Russian', popular: true, countryCode: 'ru', script: 'Cyrillic' },
  { code: 'kor_Hang', name: 'Korean', popular: true, countryCode: 'kr', script: 'Hangul' },
  { code: 'nld_Latn', name: 'Dutch', popular: true, countryCode: 'nl', script: 'Latin' },
  { code: 'pol_Latn', name: 'Polish', popular: true, countryCode: 'pl', script: 'Latin' },
  { code: 'tur_Latn', name: 'Turkish', popular: true, countryCode: 'tr', script: 'Latin' },
  { code: 'swe_Latn', name: 'Swedish', popular: true, countryCode: 'se', script: 'Latin' },
  { code: 'pan_Guru', name: 'Punjabi', popular: true, countryCode: 'in', script: 'Gurmukhi' },
  { code: 'ben_Beng', name: 'Bengali', popular: true, countryCode: 'bd', script: 'Bengali' },
  { code: 'tam_Taml', name: 'Tamil', popular: true, countryCode: 'in', script: 'Tamil' },
  { code: 'tel_Telu', name: 'Telugu', popular: true, countryCode: 'in', script: 'Telugu' },
  { code: 'mar_Deva', name: 'Marathi', popular: false, countryCode: 'in', script: 'Devanagari' },
  { code: 'ukr_Cyrl', name: 'Ukrainian', popular: false, countryCode: 'ua', script: 'Cyrillic' },
  { code: 'vie_Latn', name: 'Vietnamese', popular: false, countryCode: 'vn', script: 'Latin' },
  { code: 'ind_Latn', name: 'Indonesian', popular: false, countryCode: 'id', script: 'Latin' },
  { code: 'urd_Arab', name: 'Urdu', popular: false, countryCode: 'pk', script: 'Arabic' },
  { code: 'pes_Arab', name: 'Persian (Farsi)', popular: false, countryCode: 'ir', script: 'Arabic' },
  { code: 'ell_Grek', name: 'Greek', popular: false, countryCode: 'gr', script: 'Greek' },
  { code: 'ces_Latn', name: 'Czech', popular: false, countryCode: 'cz', script: 'Latin' },
  { code: 'hun_Latn', name: 'Hungarian', popular: false, countryCode: 'hu', script: 'Latin' },
  { code: 'ron_Latn', name: 'Romanian', popular: false, countryCode: 'ro', script: 'Latin' },
  { code: 'tha_Thai', name: 'Thai', popular: false, countryCode: 'th', script: 'Thai' },
  { code: 'cat_Latn', name: 'Catalan', popular: false, countryCode: 'es', script: 'Latin' },
  { code: 'dan_Latn', name: 'Danish', popular: false, countryCode: 'dk', script: 'Latin' },
  { code: 'fin_Latn', name: 'Finnish', popular: false, countryCode: 'fi', script: 'Latin' },
  { code: 'nob_Latn', name: 'Norwegian', popular: false, countryCode: 'no', script: 'Latin' },
  { code: 'heb_Hebr', name: 'Hebrew', popular: false, countryCode: 'il', script: 'Hebrew' },
  { code: 'msa_Latn', name: 'Malay', popular: false, countryCode: 'my', script: 'Latin' },
  { code: 'slv_Latn', name: 'Slovenian', popular: false, countryCode: 'si', script: 'Latin' },
  { code: 'srp_Cyrl', name: 'Serbian', popular: false, countryCode: 'rs', script: 'Cyrillic' },
  { code: 'kat_Geor', name: 'Georgian', popular: false, countryCode: 'ge', script: 'Georgian' },
  { code: 'hye_Armn', name: 'Armenian', popular: false, countryCode: 'am', script: 'Armenian' },
  { code: 'swa_Latn', name: 'Swahili', popular: false, countryCode: 'ke', script: 'Latin' },
  { code: 'kan_Knda', name: 'Kannada', popular: false, countryCode: 'in', script: 'Kannada' },
  { code: 'mal_Mlym', name: 'Malayalam', popular: false, countryCode: 'in', script: 'Malayalam' },
  { code: 'guj_Gujr', name: 'Gujarati', popular: false, countryCode: 'in', script: 'Gujarati' },
  { code: 'mri_Latn', name: 'Maori', popular: false, countryCode: 'nz', script: 'Latin' },
  { code: 'afr_Latn', name: 'Afrikaans', popular: false, countryCode: 'za', script: 'Latin' },
  { code: 'isl_Latn', name: 'Icelandic', popular: false, countryCode: 'is', script: 'Latin' }
];

const PIPELINE_STAGES = [
  { id: 1, name: 'Media Extraction', desc: 'Separating video and audio streams using FFmpeg' },
  { id: 2, name: 'WhisperX Transcription', desc: 'Transcribing text with phoneme timestamp alignment' },
  { id: 3, name: 'PyAnnote Diarization', desc: 'Clustering multi-speaker acoustic characteristics' },
  { id: 4, name: 'NLLB-200 Translation', desc: 'Translating dialogue with target grammar optimization' },
  { id: 5, name: 'Emotion Analysis', desc: 'Extracting prosody, pitch contours, and vocal intensity' },
  { id: 6, name: 'XTTS-v2 Speech Synthesis', desc: 'Synthesizing voice with zero-shot speaker cloning' },
  { id: 7, name: 'Timing & Pacing Alignment', desc: 'Resolving duration mismatches and speech rate' },
  { id: 8, name: 'Audio-Video Sync', desc: 'Merging synthesized audio with background tracks' },
  { id: 9, name: 'Final Rendering', desc: 'Compiling high-definition multi-track output' }
];

const INITIAL_PROJECTS: any[] = [];


export default function App() {
  const [activeTab, setActiveTab] = useState('studio');
  const [workflowStep, setWorkflowStep] = useState(1);

  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [projectName, setProjectName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sourceLang, setSourceLang] = useState('Auto-Detect');
  const [selectedTargetLang, setSelectedTargetLang] = useState<any>(NLLB_LANGUAGES[1]);
  const [langSearchQuery, setLangSearchQuery] = useState('');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const [voiceType, setVoiceType] = useState('Auto Speaker Clone');
  const [voiceStyle, setVoiceStyle] = useState('Natural (Default)');
  const [preserveEmotion, setPreserveEmotion] = useState(true);
  const [preserveIdentity, setPreserveIdentity] = useState(true);
  const [advancedSubtitles, setAdvancedSubtitles] = useState(true);
  const [advancedBgm, setAdvancedBgm] = useState(true);
  const [advancedDiarize, setAdvancedDiarize] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(true);

  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [stageProgresses, setStageProgresses] = useState<number[]>(Array(9).fill(0));
  const [overallProgress, setOverallProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [audioSourceToggle, setAudioSourceToggle] = useState('dubbed');
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  // ============ NEW STATE FOR BACKEND ============
  const [projects, setProjects] = useState<any[]>(INITIAL_PROJECTS);
  const [dubbedFileUrl, setDubbedFileUrl] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  useEffect(() => {
    api.listJobs()
      .then((jobs: any) => setProjects(jobs))
      .catch((err: any) => console.warn("Failed to fetch jobs:", err));
  }, []);
  // ===============================================

  useEffect(() => {
    return () => {
      if (filePreviewUrl && filePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    const validExtensions = ['mp4', 'mov', 'mkv', 'webm', 'mp3', 'wav', 'm4a', 'aac', 'flac'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!validExtensions.includes(ext)) {
      alert(`Unsupported format (.${ext}). Please select a valid video or audio file.`);
      return;
    }

    if (filePreviewUrl && filePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(filePreviewUrl);
    }

    setUploadedFile({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.type.startsWith('video') ? 'video' : 'audio',
      rawFile: file,
      ext: ext.toUpperCase()
    });

    const url = URL.createObjectURL(file);
    setFilePreviewUrl(url);

    if (!projectName) {
      setProjectName(file.name.replace(/\.[^/.]+$/, "") + " (Dubbed)");
    }
  };

  const removeSelectedFile = () => {
    if (filePreviewUrl && filePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setUploadedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filteredLanguages = NLLB_LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(langSearchQuery.toLowerCase()) ||
    l.code.toLowerCase().includes(langSearchQuery.toLowerCase())
  );

  // ============ REPLACED: REAL BACKEND CALL ============
  const startDubbingProcess = async () => {
    if (!uploadedFile?.rawFile) {
      alert("Please upload a media file first.");
      return;
    }

    setWorkflowStep(2);
    setIsProcessing(true);
    setCurrentStageIdx(0);
    setStageProgresses(Array(9).fill(0));
    setOverallProgress(0);
    setElapsedTime(0);
    setTerminalLogs([`[SYS] Uploading ${uploadedFile.name}...`]);

    try {
      const { job_id } = await api.createJob({
        file: uploadedFile.rawFile,
        targetLang: selectedTargetLang.code,
        projectName: projectName || uploadedFile.name,
        voiceType, voiceStyle,
        preserveEmotion, preserveIdentity,
        subtitles: advancedSubtitles,
        bgm: advancedBgm,
        diarize: advancedDiarize,
      } as any);

      setCurrentJobId(job_id);
      setTerminalLogs((prev: any[]) => [...prev, `[SYS] Job created: ${job_id}`]);

      await api.waitForJob(job_id, (job: any) => {
        setOverallProgress(job.progress);
        setCurrentStageIdx(job.stage_index);
        setStageProgresses(job.stage_progresses);
        setTerminalLogs(job.logs);
        setElapsedTime(job.elapsed_seconds);
      });

      const finished: any = await api.getJob(job_id);
      setDubbedFileUrl(finished.result_url ? api.fileUrl(finished.result_url) : null);
      setProjects(await api.listJobs());
      setIsProcessing(false);
      setWorkflowStep(3);
    } catch (err: any) {
      console.error("Dubbing failed:", err);
      setIsProcessing(false);
      setWorkflowStep(1);
      alert(`Dubbing failed: ${err.message ?? err}`);
    }
  };
  // =====================================================

  // ============ REPLACED: CANCEL CALLS BACKEND ============
  const cancelDubbingProcess = async () => {
    if (currentJobId) {
      try { await api.cancelJob(currentJobId); } catch (e) { /* ignore */ }
    }
    setIsProcessing(false);
    setWorkflowStep(1);
  };
  // ======================================================

  const sampleDialogueSegments = [
    {
      id: 'seg_1',
      speaker: 'Speaker 01',
      speakerColor: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
      time: '00:02.10 - 00:06.40',
      source: 'Welcome to the future of AI video dubbing with original emotion.',
      translated: selectedTargetLang.code === 'hin_Deva'
        ? 'मूल भावना के साथ AI वीडियो डबिंग के भविष्य में आपका स्वागत है।'
        : `[${selectedTargetLang.name}] Welcome to the future of AI video dubbing...`
    },
    {
      id: 'seg_2',
      speaker: 'Speaker 02',
      speakerColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      time: '00:07.15 - 00:12.80',
      source: 'Notice how the voice tone and pitch dynamics are preserved naturally.',
      translated: selectedTargetLang.code === 'hin_Deva'
        ? 'ध्यान दें कि आवाज का स्वर और पिच कैसे स्वाभाविक रूप से संरक्षित हैं।'
        : `[${selectedTargetLang.name}] Notice how the voice tone and pitch dynamics are preserved naturally.`
    },
    {
      id: 'seg_3',
      speaker: 'Speaker 01',
      speakerColor: 'text-violet-400 bg-violet-500/10 border-violet-500/30',
      time: '00:13.20 - 00:18.05',
      source: 'We support over 200 languages using Meta NLLB-200 and voice cloning.',
      translated: selectedTargetLang.code === 'hin_Deva'
        ? 'हम Meta NLLB-200 और वॉयस क्लोनिंग का उपयोग करके 200 से अधिक भाषाओं का समर्थन करते हैं।'
        : `[${selectedTargetLang.name}] We support over 200 languages...`
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-violet-500/30 selection:text-violet-200">

      {/* ============ HEADER ============ */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/20 border border-violet-400/30">
            <Waves className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-tight text-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                Vocult Studio
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                AI Voice v2.4
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Multilingual Emotion-Preserving Neural Dubbing
            </p>
          </div>
        </div>

        <nav className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button onClick={() => setActiveTab('studio')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'studio'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
            <Mic className="w-3.5 h-3.5" /><span>Studio</span>
          </button>
          <button onClick={() => setActiveTab('projects')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'projects'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
            <FolderKanban className="w-3.5 h-3.5" /><span>Projects</span>
            {projects.length > 0 && (
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded-full border border-slate-700">
                {projects.length}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
            <Settings className="w-3.5 h-3.5" /><span>Engine Specs</span>
          </button>
        </nav>

        <div className="hidden lg:flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-300 font-medium">XTTS-v2 & NLLB Engine Ready</span>
        </div>
      </header>

      {/* ============ MAIN ============ */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col">
        {activeTab === 'studio' && (
          <div className="flex-1 flex flex-col space-y-6">

            {/* STEP 1: Upload & Settings */}
            {workflowStep === 1 && (
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                          <Upload className="w-5 h-5 text-violet-400" />
                          <span>Source Media File</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Upload video or audio for emotion-preserving translation
                        </p>
                      </div>
                      {uploadedFile && (
                        <button onClick={removeSelectedFile}
                          className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 transition-all">
                          <X className="w-3.5 h-3.5" /><span>Clear File</span>
                        </button>
                      )}
                    </div>

                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleFileDrop}
                      onClick={() => !uploadedFile && fileInputRef.current?.click()}
                      className={`relative rounded-xl border-2 border-dashed transition-all p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-[260px] ${
                        isDragOver
                          ? 'border-violet-500 bg-violet-500/10 scale-[1.005]'
                          : uploadedFile
                          ? 'border-slate-700 bg-slate-950/80 cursor-default'
                          : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/70'
                      }`}>
                      <input type="file" ref={fileInputRef} onChange={handleFileInput}
                        accept="video/*,audio/*,.mp4,.mov,.mkv,.webm,.mp3,.wav,.m4a,.aac,.flac"
                        className="hidden" />

                      {!uploadedFile ? (
                        <div className="space-y-3 flex flex-col items-center">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-500/20 to-indigo-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                            <Upload className="w-7 h-7" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-200">
                              Drag and drop your media file here, or{' '}
                              <span className="text-violet-400 hover:underline">click to browse</span>
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              Supports MP4, MOV, MKV, WEBM, MP3, WAV, M4A, AAC, FLAC
                            </p>
                          </div>
                          <div className="pt-2 flex items-center space-x-2 text-[11px] text-slate-400">
                            <Shield className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Zero-retention local simulation • Audio waveform auto-extract</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full flex flex-col space-y-4 text-left">
                          <div className="flex items-center space-x-4 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
                            <div className="w-12 h-12 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 flex-shrink-0">
                              {uploadedFile.type === 'video' ? <Play className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-100 truncate">{uploadedFile.name}</p>
                              <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
                                <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono text-[10px]">
                                  {uploadedFile.ext}
                                </span>
                                <span>{uploadedFile.size}</span>
                                <span>•</span>
                                <span className="text-emerald-400 font-medium">Ready for Dubbing</span>
                              </div>
                            </div>
                          </div>

                          {filePreviewUrl && (
                            <div className="rounded-xl overflow-hidden border border-slate-800 bg-black max-h-[220px] flex items-center justify-center relative group">
                              {uploadedFile.type === 'video' ? (
                                <video src={filePreviewUrl} controls
                                  className="w-full h-auto max-h-[210px] object-contain" />
                              ) : (
                                <div className="p-6 w-full flex flex-col items-center justify-center space-y-3 bg-gradient-to-b from-slate-900 to-black">
                                  <Waves className="w-12 h-12 text-violet-400 animate-pulse" />
                                  <audio src={filePreviewUrl} controls className="w-full max-w-md" />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-semibold text-slate-300">Project Name</label>
                      <input type="text" value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="e.g. Corporate_Presentation_Spanish"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500 transition-colors" />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">Prosody Sync</p>
                        <p className="text-[10px] text-slate-400">Pitch & Cadence Retention</p>
                      </div>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">NLLB-200</p>
                        <p className="text-[10px] text-slate-400">200+ Neural Languages</p>
                      </div>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">XTTS-v2</p>
                        <p className="text-[10px] text-slate-400">Zero-Shot Speaker Clone</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                          <Languages className="w-4 h-4 text-violet-400" />
                          <span>1. Target Language (NLLB-200 Catalogue)</span>
                        </label>
                        <span className="text-[10px] font-mono bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded border border-violet-500/20">
                          {selectedTargetLang.code}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        {NLLB_LANGUAGES.filter(l => l.popular).slice(0, 8).map((lang) => (
                          <button key={lang.code} type="button"
                            onClick={() => setSelectedTargetLang(lang)}
                            className={`px-2 py-1.5 rounded-lg text-[11px] font-medium flex items-center space-x-1.5 transition-all truncate border ${
                              selectedTargetLang.code === lang.code
                                ? 'bg-violet-600 text-white border-violet-400 shadow-md shadow-violet-600/30 font-bold'
                                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                            }`}>
                            <img src={`https://flagcdn.com/w20/${lang.countryCode}.png`}
                              alt={lang.name} className="w-4 h-3 object-cover rounded-sm flex-shrink-0" />
                            <span className="truncate">{lang.name.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>

                      <div className="relative pt-2">
                        <div onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                          className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 flex items-center justify-between cursor-pointer transition-colors">
                          <div className="flex items-center space-x-2.5">
                            <img src={`https://flagcdn.com/w20/${selectedTargetLang.countryCode}.png`}
                              alt={selectedTargetLang.name} className="w-4 h-3 object-cover rounded-sm" />
                            <span className="font-semibold text-slate-100">{selectedTargetLang.name}</span>
                            <span className="text-slate-400 font-mono text-[10px]">({selectedTargetLang.script})</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {isLangDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 p-3 space-y-2 max-h-[280px] flex flex-col">
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                              <input type="text" value={langSearchQuery}
                                onChange={(e) => setLangSearchQuery(e.target.value)}
                                placeholder="Search 200+ NLLB languages..."
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                                autoFocus />
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                              {filteredLanguages.length > 0 ? filteredLanguages.map((lang) => (
                                <div key={lang.code}
                                  onClick={() => {
                                    setSelectedTargetLang(lang);
                                    setIsLangDropdownOpen(false);
                                    setLangSearchQuery('');
                                  }}
                                  className={`px-3 py-2 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                                    selectedTargetLang.code === lang.code
                                      ? 'bg-violet-600/20 text-violet-200 font-bold border border-violet-500/30'
                                      : 'hover:bg-slate-800/80 text-slate-300'
                                  }`}>
                                  <div className="flex items-center space-x-2.5">
                                    <img src={`https://flagcdn.com/w20/${lang.countryCode}.png`}
                                      alt={lang.name} className="w-4 h-3 object-cover rounded-sm" />
                                    <span>{lang.name}</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-400">{lang.code}</span>
                                </div>
                              )) : (
                                <p className="text-xs text-slate-400 p-3 text-center">
                                  No NLLB language matching "{langSearchQuery}"
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="h-px bg-slate-800/80 my-2" />

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                        <Mic className="w-4 h-4 text-violet-400" />
                        <span>2. Voice & Tone Profile</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-1">Voice Type</span>
                          <select value={voiceType} onChange={(e) => setVoiceType(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500">
                            <option>Auto Speaker Clone</option>
                            <option>Expressive Neutral</option>
                            <option>Cinematic Narrator</option>
                            <option>Warm Broadcast</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-1">Voice Style</span>
                          <select value={voiceStyle} onChange={(e) => setVoiceStyle(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500">
                            <option>Natural (Default)</option>
                            <option>High Energy</option>
                            <option>Deep & Serious</option>
                            <option>Soft Conversational</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <label className="flex items-center space-x-2.5 cursor-pointer">
                          <input type="checkbox" checked={preserveEmotion}
                            onChange={(e) => setPreserveEmotion(e.target.checked)}
                            className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-violet-600" />
                          <span className="text-xs text-slate-300 font-medium">
                            Preserve original speaker emotion and vocal intensity
                          </span>
                        </label>
                        <label className="flex items-center space-x-2.5 cursor-pointer">
                          <input type="checkbox" checked={preserveIdentity}
                            onChange={(e) => setPreserveIdentity(e.target.checked)}
                            className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-violet-600" />
                          <span className="text-xs text-slate-300 font-medium">
                            Enable XTTS-v2 zero-shot speaker timbre matching
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="h-px bg-slate-800/80 my-2" />

                    <div>
                      <button onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-slate-100 transition-colors">
                        <span className="flex items-center space-x-2">
                          <Sliders className="w-4 h-4 text-violet-400" />
                          <span>3. Advanced Dubbing Parameters</span>
                        </span>
                        {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {showAdvanced && (
                        <div className="mt-3 space-y-2.5 pt-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-300">Generate SRT/VTT Subtitles</span>
                            <input type="checkbox" checked={advancedSubtitles}
                              onChange={(e) => setAdvancedSubtitles(e.target.checked)}
                              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-violet-600" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-300">Isolate & Retain Background Music (Demucs)</span>
                            <input type="checkbox" checked={advancedBgm}
                              onChange={(e) => setAdvancedBgm(e.target.checked)}
                              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-violet-600" />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-300">Diarize Multi-Speaker Voices (PyAnnote)</span>
                            <input type="checkbox" checked={advancedDiarize}
                              onChange={(e) => setAdvancedDiarize(e.target.checked)}
                              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-violet-600" />
                          </div>
                        </div>
                      )}
                    </div>

                    <button onClick={startDubbingProcess}
                      className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-600/30 flex items-center justify-center space-x-2.5 transition-all transform active:scale-[0.99] border border-violet-400/30">
                      <Sparkles className="w-4 h-4 text-violet-200 animate-spin" />
                      <span>Start AI Voice Dubbing</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Processing */}
            {workflowStep === 2 && (
              <div className="flex-1 max-w-4xl mx-auto w-full space-y-6 py-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
                        </span>
                        <h2 className="text-lg font-bold text-slate-100">
                          Neural Dubbing Pipeline Active
                        </h2>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Translating media to <span className="text-violet-300 font-semibold">{selectedTargetLang.name}</span> with XTTS-v2 prosody preservation
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase font-mono">Elapsed Time</p>
                        <p className="text-sm font-mono font-bold text-slate-200">
                          00:{elapsedTime < 10 ? `0${elapsedTime}` : elapsedTime}
                        </p>
                      </div>
                      <button onClick={cancelDubbingProcess}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center space-x-1.5">
                        <X className="w-3.5 h-3.5" /><span>Cancel</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-violet-300 flex items-center space-x-1.5">
                        <Activity className="w-3.5 h-3.5 animate-pulse" />
                        <span>Overall Progress</span>
                      </span>
                      <span className="font-mono font-bold text-lg text-white">
                        {Math.min(100, overallProgress)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-300 shadow-lg shadow-violet-500/50"
                        style={{ width: `${Math.min(100, overallProgress)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-xl space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Execution Pipeline Stages
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PIPELINE_STAGES.map((stage, idx) => {
                      const stageProg = Math.min(100, stageProgresses[idx] || 0);
                      const isCurrent = idx === currentStageIdx && overallProgress < 100;
                      const isDone = stageProg === 100;
                      return (
                        <div key={stage.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isDone
                              ? 'bg-slate-950/80 border-emerald-500/30'
                              : isCurrent
                              ? 'bg-violet-950/30 border-violet-500/50 shadow-md shadow-violet-500/10'
                              : 'bg-slate-950/30 border-slate-800/80 opacity-60'
                          }`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center space-x-2.5">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isDone
                                  ? 'bg-emerald-500 text-slate-950'
                                  : isCurrent
                                  ? 'bg-violet-600 text-white animate-pulse'
                                  : 'bg-slate-800 text-slate-400'
                              }`}>
                                {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                              </div>
                              <span className="text-xs font-bold text-slate-200">{stage.name}</span>
                            </div>
                            <span className="text-[11px] font-mono font-semibold text-slate-400">
                              {stageProg}%
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 pl-7 line-clamp-1 mb-2">
                            {stage.desc}
                          </p>
                          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-200 ${
                                isDone ? 'bg-emerald-500' : isCurrent ? 'bg-violet-500' : 'bg-slate-800'
                              }`}
                              style={{ width: `${stageProg}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 space-y-2 shadow-2xl">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                    <span className="flex items-center space-x-2">
                      <Cpu className="w-3.5 h-3.5 text-violet-400" />
                      <span>Live Backend Execution Logs</span>
                    </span>
                    <span className="text-emerald-400">STATUS: RUNNING</span>
                  </div>
                  <div className="h-32 overflow-y-auto space-y-1 custom-scrollbar text-[11px] pt-1">
                    {terminalLogs.map((log: any, i: number) => (
                      <div key={i} className="text-slate-300">{log}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Results */}
            {workflowStep === 3 && (
              <div className="flex-1 space-y-6">
                <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-violet-950/30 border border-emerald-500/30 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                        <span>Dubbing Complete: {selectedTargetLang.name}</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Emotion Score: 98.8%
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Audio and prosody synchronized using NLLB-200 and XTTS-v2 zero-shot synthesis
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 w-full sm:w-auto">
                    <button onClick={() => setWorkflowStep(1)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all flex items-center space-x-1.5">
                      <RefreshCw className="w-3.5 h-3.5" /><span>Start New Project</span>
                    </button>
                    <button onClick={() => {
                      if (!dubbedFileUrl) return;
                      const a = document.createElement('a');
                      a.href = dubbedFileUrl;
                      a.download = `${projectName || 'dubbed'}.mp4`;
                      a.click();
                    }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-600/30 transition-all flex items-center space-x-1.5">
                      <Download className="w-3.5 h-3.5" /><span>Export Dubbed Media</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-6 space-y-4">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <span className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                          <Volume2 className="w-4 h-4 text-violet-400" />
                          <span>Playback Audio Track</span>
                        </span>
                        <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1">
                          <button onClick={() => setAudioSourceToggle('original')}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                              audioSourceToggle === 'original'
                                ? 'bg-slate-800 text-slate-100 font-bold'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}>
                            Original Audio
                          </button>
                          <button onClick={() => setAudioSourceToggle('dubbed')}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                              audioSourceToggle === 'dubbed'
                                ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-600/20'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}>
                            AI Dubbed ({selectedTargetLang.name})
                          </button>
                        </div>
                      </div>

                      <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video flex items-center justify-center relative">
                        {dubbedFileUrl ? (
                          uploadedFile?.type === 'video' ? (
                            <video src={dubbedFileUrl} controls className="w-full h-full object-contain" />
                          ) : (
                            <div className="p-8 text-center space-y-3 flex flex-col items-center">
                              <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                                <Waves className="w-8 h-8" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-200">
                                  {audioSourceToggle === 'dubbed' ? 'AI Dubbed Master Audio' : 'Original Vocal Audio'}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Synced with background ambient stems
                                </p>
                              </div>
                              <audio src={dubbedFileUrl} controls className="w-full max-w-sm pt-2" />
                            </div>
                          )
                        ) : (
                          <div className="text-center text-xs text-slate-400">Rendering…</div>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center pt-1">
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <p className="text-[10px] text-slate-400 uppercase">Acoustic Fit</p>
                          <p className="text-sm font-bold text-emerald-400">99.2%</p>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <p className="text-[10px] text-slate-400 uppercase">Lip Timing</p>
                          <p className="text-sm font-bold text-violet-400">97.8%</p>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                          <p className="text-[10px] text-slate-400 uppercase">Emotion Preserved</p>
                          <p className="text-sm font-bold text-cyan-400">98.8%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-6 space-y-4">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col h-full">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <span className="text-xs font-bold text-slate-200 flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-violet-400" />
                          <span>Translated Dialogue Timeline</span>
                        </span>
                        <span className="text-[10px] text-slate-400">3 Diarized Segments</span>
                      </div>
                      <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-1 custom-scrollbar">
                        {sampleDialogueSegments.map((seg) => (
                          <div key={seg.id}
                            onClick={() => setActiveSegmentId(seg.id)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                              activeSegmentId === seg.id
                                ? 'bg-violet-950/40 border-violet-500/60 shadow-lg'
                                : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                            }`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${seg.speakerColor}`}>
                                {seg.speaker}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-slate-500" /><span>{seg.time}</span>
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 italic">"{seg.source}"</p>
                            <p className="text-xs font-semibold text-slate-100 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                              {seg.translated}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============ PROJECTS TAB ============ */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Project History</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage previously processed dubbing files and sessions
                </p>
              </div>
              <button onClick={() => { setActiveTab('studio'); setWorkflowStep(1); }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-600/20 transition-all flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" /><span>New Dubbing Job</span>
              </button>
            </div>

            {projects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((proj: any) => (
                  <div key={proj.id}
                    className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl space-y-4 transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                          <FolderKanban className="w-5 h-5" />
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          proj.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : proj.status === 'failed'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {proj.status}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100 truncate">{proj.project_name || proj.id}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Target: <span className="text-violet-300 font-medium">{proj.target_lang_name}</span>
                        </p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>{proj.created_at}</span>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => {
                          setActiveTab('studio');
                          setWorkflowStep(3);
                          if (proj.result_url) setDubbedFileUrl(api.fileUrl(proj.result_url));
                        }}
                          className="text-violet-400 hover:text-violet-300 font-semibold text-xs flex items-center space-x-1">
                          <span>Open</span><ExternalLink className="w-3 h-3" />
                        </button>
                        <button onClick={() => setProjects(projects.filter((p: any) => p.id !== proj.id))}
                          className="text-rose-400 hover:text-rose-300 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <FolderKanban className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-slate-300">No Projects Found</p>
                <p className="text-xs text-slate-400">You haven't dubbed any audio or video files yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ============ ENGINE SPECS TAB ============ */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto w-full space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-100">AI Model Specifications</h2>
              <p className="text-xs text-slate-400 mt-1">
                Architecture configuration for the underlying Vocult Python pipeline
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-violet-400" />
                  <span>Translation Model: Meta NLLB-200</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  No Language Left Behind (NLLB-200) provides direct translation across 200+ languages without using English as a pivot.
                </p>
              </div>
              <div className="h-px bg-slate-800" />
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                  <Mic className="w-4 h-4 text-indigo-400" />
                  <span>Speech Synthesis: Coqui XTTS-v2</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  XTTS-v2 performs zero-shot voice cloning from 3 seconds of audio, retaining original emotional prosody and speaker identity.
                </p>
              </div>
              <div className="h-px bg-slate-800" />
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Diarization & Alignment: PyAnnote & WhisperX</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  WhisperX supplies word-level forced phoneme alignment while PyAnnote clusters multi-speaker audio stems.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}