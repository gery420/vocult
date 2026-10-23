const BASE = "http://127.0.0.1:8000";

export type JobProgress = {
  id: string;
  status: "queued" | "running" | "done" | "completed" | "failed" | "cancelled";
  progress: number;
  stage_index: number;
  stage_progresses: number[];
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
    const body = await res.text().catch(() => "");
    throw new Error(
      `HTTP ${res.status} ${res.statusText} — ${body.slice(0, 500)}`
    );
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
    if (!opts.targetLang || opts.targetLang.trim() === "" || opts.targetLang === "string") {
      throw new Error("Please select a valid target language.");
    }

    const form = new FormData();
    form.append("file", opts.file);
    form.append("target_lang", opts.targetLang);
    form.append("project_name", opts.projectName || "Untitled");
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
    const res = await fetch(`${BASE}/api/jobs/${jobId}/cancel`, {
      method: "POST",
    });
    await asJson<{ ok: boolean }>(res);
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

          if (job.status === "done" || job.status === "completed") {
            resolve(job);
            return;
          }

          if (job.status === "failed") {
            reject(new Error(job.error ?? "Pipeline failed"));
            return;
          }

          if (job.status === "cancelled") {
            reject(new Error("Job was cancelled"));
            return;
          }

          setTimeout(tick, intervalMs);
        } catch (err) {
          reject(err);
        }
      };

      void tick();
    });
  },
};