const BASE = "http://localhost:8000";

export type JobProgress = {
  id: string;
  status: "queued" | "running" | "done" | "failed" | "cancelled";
  progress: number;            // 0..100
  stage_index: number;         // 0..8
  stage_progresses: number[];  // length 9, each 0..100
  logs: string[];
  elapsed_seconds: number;
  result_url?: string;
  error?: string;
  project_name?: string;
  target_lang_name?: string;
  created_at?: string;
};

function absolute(path: string): string {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  baseUrl: BASE,
  fileUrl: absolute,

  async listJobs(): Promise<JobProgress[]> {
    const res = await fetch(`${BASE}/api/jobs`);
    return asJson<JobProgress[]>(res);
  },

  async getJob(jobId: string): Promise<JobProgress> {
    const res = await fetch(`${BASE}/api/jobs/${jobId}`);
    return asJson<JobProgress>(res);
  },

  async createJob(opts: {
    file: File;
    targetLang: string;
    projectName: string;
    voiceType: string;
    voiceStyle: string;
    preserveEmotion: boolean;
    preserveIdentity: boolean;
    subtitles: boolean;
    bgm: boolean;
    diarize: boolean;
  }): Promise<{ job_id: string }> {
    const form = new FormData();
    form.append("file", opts.file);
    form.append("target_lang", opts.targetLang);
    form.append("project_name", opts.projectName);
    form.append("voice_type", opts.voiceType);
    form.append("voice_style", opts.voiceStyle);
    form.append("preserve_emotion", String(opts.preserveEmotion));
    form.append("preserve_identity", String(opts.preserveIdentity));
    form.append("subtitles", String(opts.subtitles));
    form.append("bgm", String(opts.bgm));
    form.append("diarize", String(opts.diarize));

    const res = await fetch(`${BASE}/api/jobs`, {
      method: "POST",
      body: form,
    });
    return asJson<{ job_id: string }>(res);
  },

  async cancelJob(jobId: string): Promise<void> {
    await fetch(`${BASE}/api/jobs/${jobId}/cancel`, { method: "POST" });
  },

  async waitForJob(
    jobId: string,
    onUpdate: (job: JobProgress) => void,
    intervalMs = 1000
  ): Promise<JobProgress> {
    return new Promise((resolve, reject) => {
      const tick = async () => {
        try {
          const job = await api.getJob(jobId);
          onUpdate(job);
          if (job.status === "done") return resolve(job);
          if (job.status === "failed") return reject(new Error(job.error ?? "Pipeline failed"));
          if (job.status === "cancelled") return reject(new Error("Cancelled"));
          setTimeout(tick, intervalMs);
        } catch (err) {
          reject(err);
        }
      };
      tick();
    });
  },
};