require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { HfInference } = require("@huggingface/inference");
const { Octokit } = require("@octokit/rest");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3001", "https://morphly-app-production-front.up.railway.app"] }));
app.use(express.json());

// in-memory job store
const jobs = {};

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
    const openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });

    const completion = await openai.chat.completions.create({
      model: "openrouter/auto",
      messages: [
        { role: "system", content: `Write COMPLETE valid Manim Python code. 
MUST start with: from manim import *
Then: class Main(Scene):
    def construct(self):
        # your animation for: "${prompt}"

NO markdown. NO explanations. ONLY pure executable Python code. Make sure to close any open brackets , no syntax errors. Always write code for Manim Community Edition (ManimCE).
Do not use TextMobject or TexMobject (these are deprecated). Use Text() for plain text and Tex() for LaTeX math.` },
        { role: "user", content: prompt }
      ],
      max_tokens: 600,
    });

    let manimCode = completion.choices[0].message.content.trim();

    // Strip markdown codeblocks
    manimCode = manimCode
      .replace(/^```(?:python|py|)?\s*\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    console.log("Clean code:", manimCode);

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
    await octokit.rest.actions.createWorkflowDispatch({
      owner: process.env.GITHUB_OWNER,
      repo: process.env.GITHUB_REPO,
      workflow_id: 220414432,
      ref: "main",
      inputs: {
        source_file: scriptPath,
        scene_names: "Main",
      },
    });

    // STEP 4: Store job data (no runId yet — createWorkflowDispatch returns 204 No Content)
    jobs[jobId] = {
      status: "running",
      videoUrl: null,
      error: null,
      ghRunId: null,
      ghRepo: `${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`,
    };

    // Wait 5 seconds then fetch the latest run ID
    setTimeout(async () => {
      try {
        const runs = await octokit.rest.actions.listWorkflowRuns({
          owner: process.env.GITHUB_OWNER,
          repo: process.env.GITHUB_REPO,
          workflow_id: 220414432,
          per_page: 1,
        });
        jobs[jobId].ghRunId = runs.data.workflow_runs[0].id;
        pollWorkflowStatus(jobId);
      } catch (e) {
        jobs[jobId].status = "error";
        jobs[jobId].error = e.message;
      }
    }, 5000);

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

  if (job.status === "running") {
    try {
      await pollWorkflowStatus(jobId);
    } catch (e) {
      // ignore errors, job object already has last known status
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
      const run = await octokit.rest.actions.getWorkflowRun({
        owner: job.ghRepo.split("/")[0],
        repo: job.ghRepo.split("/")[1],
        run_id: job.ghRunId,
      });

      if (run.data.status === "completed") {
        if (run.data.conclusion === "success") {
          const artifacts = await octokit.rest.actions.listWorkflowRunArtifacts({
            owner: job.ghRepo.split("/")[0],
            repo: job.ghRepo.split("/")[1],
            run_id: job.ghRunId,
          });

          console.log("ALL ARTIFACTS:", artifacts.data.artifacts.map(a => a.name));

          const videoArtifact = artifacts.data.artifacts.find(a => a.name.includes("manim"));
          if (videoArtifact) {
            job.status = "done";
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

  const checkDone = () => {
    if (job.status !== "running") {
      clearInterval(interval);
    } else {
      setTimeout(checkDone, 5000);
    }
  };
  checkDone();
}

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});