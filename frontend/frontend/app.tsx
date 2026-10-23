import { useEffect, useRef, useState } from "react";
import { listJobs, createJob, getJob, outputUrl, type Job } from "./api/client";

const STAGES = [
  "Uploading",
  "Extracting audio",
  "Transcribing (WhisperX)",
  "Detecting language",
  "Translating (NLLB)",
  "Generating speech (TTS)",
  "Cloning voice",
  "Merging timeline",
  "Finalizing",
];

function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [active, setActive] = useState<Job | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"dub" | "projects">("dub");
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    listJobs()
      .then(setJobs)
      .catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    if (!active) return;
    if (active.status === "done" || active.status === "failed") return;

    const tick = async () => {
      try {
        const fresh = await getJob(active.id);
        setActive(fresh);
        setJobs((prev) => {
          const idx = prev.findIndex((j) => j.id === fresh.id);
          if (idx === -1) return [fresh, ...prev];
          const copy = [...prev];
          copy[idx] = fresh;
          return copy;
        });
      } catch {
        /* keep polling */
      }
    };

    pollRef.current = window.setInterval(tick, 1500);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [active?.id, active?.status]);

  async function start() {
    if (!file || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const job = await createJob(file);
      setActive(job);
      setJobs((prev) => [job, ...prev]);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const stageIndex = active
    ? active.stage
      ? STAGES.findIndex((s) =>
          s.toLowerCase().startsWith(active.stage!.toLowerCase().split(" ")[0])
        )
      : Math.floor(((active.progress ?? 0) / 100) * STAGES.length)
    : -1;

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">AI Voice Dubbing</h1>
        <nav className="flex gap-2">
          <button
            onClick={() => setTab("dub")}
            className={`px-4 py-2 rounded ${
              tab === "dub" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300"
            }`}
          >
            Dub
          </button>
          <button
            onClick={() => setTab("projects")}
            className={`px-4 py-2 rounded ${
              tab === "projects" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300"
            }`}
          >
            Projects ({jobs.length})
          </button>
        </nav>
      </header>

      {err && (
        <div className="mb-4 p-3 rounded bg-red-900/40 border border-red-700 text-red-200 text-sm">
          {err}
        </div>
      )}

      {tab === "dub" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Upload video</h2>
            <label className="block border-2 border-dashed border-slate-700 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 transition">
              <input
                type="file"
                accept="video/*,audio/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-slate-400">
                {file ? file.name : "Click to choose a short MP4 (5–15s)"}
              </p>
            </label>
            <button
              onClick={start}
              disabled={!file || busy}
              className="mt-4 w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium"
            >
              {busy ? "Starting…" : "Start AI Voice Dubbing"}
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Pipeline</h2>
            {!active && <p className="text-slate-500 text-sm">No job yet.</p>}
            {active && (
              <>
                <div className="mb-3 text-sm text-slate-400">
                  {active.status === "done"
                    ? "✅ Finished"
                    : active.status === "failed"
                    ? `❌ Failed: ${active.error ?? "unknown"}`
                    : `Running — ${
                        active.stage ??
                        STAGES[Math.max(0, stageIndex)] ??
                        "…"
                      }`}
                </div>
                <div className="w-full h-2 bg-slate-800 rounded overflow-hidden mb-4">
                  <div
                    className="h-full bg-indigo-500 transition-all"
                    style={{ width: `${Math.min(100, active.progress ?? 0)}%` }}
                  />
                </div>
                <ol className="space-y-1">
                  {STAGES.map((s, i) => {
                    const done = active.status === "done" || i < stageIndex;
                    const cur = i === stageIndex && active.status !== "done";
                    return (
                      <li
                        key={s}
                        className={`flex items-center gap-2 text-sm ${
                          done
                            ? "text-emerald-400"
                            : cur
                            ? "text-indigo-300"
                            : "text-slate-600"
                        }`}
                      >
                        <span className="w-4 text-center">
                          {done ? "✓" : cur ? "●" : "○"}
                        </span>
                        {s}
                      </li>
                    );
                  })}
                </ol>
                {active.status === "done" && (
                  <a
                    href={outputUrl(active.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-block px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-sm"
                  >
                    Download dubbed audio
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {tab === "projects" && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-medium text-white mb-4">All jobs</h2>
          {jobs.length === 0 && <p className="text-slate-500 text-sm">Nothing yet.</p>}
          <ul className="divide-y divide-slate-800">
            {jobs.map((j) => (
              <li key={j.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-white text-sm">{j.filename ?? j.id}</div>
                  <div className="text-xs text-slate-500">
                    {j.status} · {j.progress ?? 0}%
                  </div>
                </div>
                {j.status === "done" && (
                  <a
                    href={outputUrl(j.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 text-sm hover:underline"
                  >
                    open
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;