require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { HfInference } = require("@huggingface/inference");
const { Octokit } = require("@octokit/rest");const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 8000;

// allow your React dev origin
app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3001", "https://morphly-app-production-front.up.railway.app"] }));
app.use(express.json());

// in-memory job store for demo
const jobs = {}; // { [jobId]: { status, videoUrl, error, ghRunId } }

// health check
app.get("/", (req, res) => {
  res.json({ ok: true });
});

// 1) generate endpoint
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt required" });

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;


// STEP 1: OpenRouter → generate Manim code
// STEP 1: OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

const completion = await openai.chat.completions.create({
  model: "openrouter/auto",  // ✅ Always picks available free model
  messages: [
    { role: "system", content: `Write COMPLETE valid Manim Python code. 
MUST start with: from manim import *
Then: class Main(Scene):
    def construct(self):
        # your animation for: "${prompt}"

NO markdown. NO explanations. ONLY pure executable Python code. Make sure to close any open brackets , no syntax errors` },
    { role: "user", content: prompt }
  ],
  max_tokens: 600,
});

//const manimCode = completion.choices[0].message.content.trim();  // ✅ OpenAI format
let manimCode = completion.choices[0].message.content.trim();

// ❌ STRIP markdown codeblocks
manimCode = manimCode
  .replace(/^```(?:python|py|)?\s*\n?/, '')  // Remove opening ```
  .replace(/\n?```$/, '')                    // Remove closing ```
  .trim();

console.log("Clean code:", manimCode);  // Verify pure Python

const scriptPath = `generated/${jobId}.py`;

    // STEP 2: Write code to GitHub repo
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      path: scriptPath,
      message: `Add Manim script for ${jobId}`,
      content: Buffer.from(manimCode).toString("base64"),
    });

    // STEP 3: Trigger GitHub Actions workflow
    const workflowResponse = await octokit.rest.actions.createWorkflowDispatch({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      workflow_id: 220414432,
      ref: "main", // your branch
      inputs: {
        source_file: scriptPath,
        scene_names: "Main", // assume scene class is "Main"
      },
    });
    const runId = workflowResponse.data.id;

    // STEP 4: Store job data
    jobs[jobId] = {
      status: "running",
      videoUrl: null,
      error: null,
      ghRunId: runId,
      ghRepo: `${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`,
    };

    // Poll for completion (runs every status check)
    pollWorkflowStatus(jobId);

    res.json({ jobId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2) status endpoint
app.get("/api/status/:jobId", async (req, res) => {
  const { jobId } = req.params;
  const job = jobs[jobId];
  if (!job) {
    return res.status(404).json({ status: "error", message: "Job not found" });
  }

  // optional: if you want to re‑poll GitHub while running
  if (job.status === "running") {
    try {
      await pollWorkflowStatus(jobId);
    } catch (e) {
      // ignore errors here, job object already has last known status
    }
  }

  res.json({
    status: job.status,
    videoUrl: job.videoUrl,
    message: job.error,
  });
});

// Poll GitHub workflow status
async function pollWorkflowStatus(jobId) {
  const job = jobs[jobId];
  if (!job || !job.ghRunId) return;

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  
  const poll = async () => {
    try {
      // Get run status
      const run = await octokit.rest.actions.getWorkflowRun({
        owner: job.ghRepo.split("/")[0],
        repo: job.ghRepo.split("/")[1],
        run_id: job.ghRunId,
      });

      if (run.data.status === "completed") {
        if (run.data.conclusion === "success") {
          // Get artifacts
          const artifacts = await octokit.rest.actions.listWorkflowRunArtifacts({
            owner: job.ghRepo.split("/")[0],
            repo: job.ghRepo.split("/")[1],
            run_id: job.ghRunId,
          });

          console.log("ALL ARTIFACTS:", artifacts.data.artifacts.map(a => a.name));

        const videoArtifact = artifacts.data.artifacts.find(a => a.name.includes("manim"));  // Matches ANY manim-*
        if (videoArtifact) {
          job.status = "done";
          // Direct MP4 (no .zip)
          job.videoUrl = `https://${process.env.GITHUB_OWNER}.github.io/${process.env.GITHUB_REPO}/videos/latest.mp4`;
          console.log("VIDEO URL:", job.videoUrl);
        } else {
            job.status = "error";
            job.error = "No video artifact found";
          }
        } else {
          job.status = "error";
          job.error = `Workflow failed: ${run.data.conclusion}`;
        }
      }
    } catch (err) {
      job.status = "error";
      job.error = `Poll error: ${err.message}`;
    }
  };

  // Poll every 10 seconds until done
  const interval = setInterval(poll, 10000);
  poll(); // immediate check

  // Clear when done
  const checkDone = () => {
    if (job.status !== "running") {
      clearInterval(interval);
    } else {
      setTimeout(checkDone, 5000);
    }
  };
  checkDone();
}
// ... your pollWorkflowStatus function ends ...

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
