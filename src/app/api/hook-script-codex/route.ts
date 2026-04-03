import crypto from "crypto";

export async function GET() {
  const hash = crypto.createHash("sha256").update(HOOK_SCRIPT).digest("hex");
  const canonicalUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return new Response(HOOK_SCRIPT, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "X-Script-Hash": hash,
      ...(canonicalUrl ? { "X-Canonical-Url": canonicalUrl } : {}),
    },
  });
}

const HOOK_SCRIPT = `const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");
const http = require("http");

// 5초 hard timeout — Codex CLI 세션 종료 지연 방지
const HARD_TIMEOUT = setTimeout(() => process.exit(0), 5000);
HARD_TIMEOUT.unref();

const FALLBACK_URLS = [
  "https://ab-180-ai-leaderboard.vercel.app",
  "https://ai-camp-web.vercel.app"
];

function checkAndFixApiUrl(apiUrl, callback) {
  function tryUrl(url, cb) {
    try {
      const u = new URL(url + "/api/usage/submit");
      const mod = u.protocol === "https:" ? https : http;
      const req = mod.request(u, { method: "HEAD", timeout: 2000 }, (res) => {
        res.on("data", () => {});
        res.on("end", () => cb(res.statusCode >= 200 && res.statusCode < 500));
      });
      req.on("timeout", () => { req.destroy(); cb(false); });
      req.on("error", () => cb(false));
      req.end();
    } catch { cb(false); }
  }

  tryUrl(apiUrl, (ok) => {
    if (ok) { callback(apiUrl); return; }
    // Current URL is dead — try fallbacks
    const remaining = FALLBACK_URLS.filter((u) => u !== apiUrl);
    let i = 0;
    function next() {
      if (i >= remaining.length) { callback(apiUrl); return; } // all failed, use original
      const candidate = remaining[i++];
      tryUrl(candidate, (ok2) => {
        if (ok2) {
          // Update api_url file
          try {
            const configDir = path.join(os.homedir(), ".config", "ai-camp");
            if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
            fs.writeFileSync(path.join(configDir, "api_url"), candidate);
          } catch {}
          callback(candidate);
        } else {
          next();
        }
      });
    }
    next();
  });
}

const PRICING = {
  "o3":            { input: 10, output: 40, cache_read: 2.50 },
  "o4-mini":       { input: 1.10, output: 4.40, cache_read: 0.275 },
  "gpt-4.1":       { input: 2, output: 8, cache_read: 0.50 },
  "gpt-4.1-mini":  { input: 0.40, output: 1.60, cache_read: 0.10 },
  "gpt-4.1-nano":  { input: 0.10, output: 0.40, cache_read: 0.025 },
};

function getPrice(model) {
  if (!model) return PRICING["o4-mini"];
  for (const [key, price] of Object.entries(PRICING)) {
    if (model === key || model.startsWith(key)) return price;
  }
  if (model.includes("o3")) return PRICING["o3"];
  if (model.includes("o4-mini")) return PRICING["o4-mini"];
  if (model.includes("gpt-4.1-nano")) return PRICING["gpt-4.1-nano"];
  if (model.includes("gpt-4.1-mini")) return PRICING["gpt-4.1-mini"];
  if (model.includes("gpt-4.1")) return PRICING["gpt-4.1"];
  return PRICING["o4-mini"];
}

// --- Session Cache: resumed 세션 delta 계산용 ---
function getSessionCachePath() {
  return path.join(os.homedir(), ".config", "ai-camp", "session-cache.json");
}

function loadSessionCache() {
  try {
    return JSON.parse(fs.readFileSync(getSessionCachePath(), "utf8"));
  } catch { return {}; }
}

function saveSessionCache(cache) {
  try {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    for (const [key, val] of Object.entries(cache)) {
      if (val.ts && val.ts < cutoff) delete cache[key];
    }
    fs.writeFileSync(getSessionCachePath(), JSON.stringify(cache));
  } catch {}
}

// --- Throttle: 30분 간격 제한 ---
const THROTTLE_MINUTES = 30;

function getLastReportPath() {
  return path.join(os.homedir(), ".config", "ai-camp", "last-report.txt");
}

function shouldThrottle() {
  try {
    const lastReportPath = getLastReportPath();
    if (!fs.existsSync(lastReportPath)) return false;
    const lastTs = parseInt(fs.readFileSync(lastReportPath, "utf8").trim(), 10);
    return (Date.now() - lastTs) < THROTTLE_MINUTES * 60 * 1000;
  } catch { return false; }
}

function updateLastReport() {
  try {
    const configDir = path.join(os.homedir(), ".config", "ai-camp");
    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(getLastReportPath(), String(Date.now()));
  } catch {}
}

// --- Local Queue: 서버 다운 시 데이터 보존 ---
function getQueuePath() {
  return path.join(os.homedir(), ".config", "ai-camp", "queue.jsonl");
}

function enqueue(data) {
  try {
    fs.appendFileSync(getQueuePath(), data + "\\n");
  } catch {}
}

function drainQueue(apiUrl, token, maxItems) {
  try {
    const qPath = getQueuePath();
    if (!fs.existsSync(qPath)) return;
    const lines = fs.readFileSync(qPath, "utf8").split("\\n").filter(Boolean);
    if (lines.length === 0) return;

    const toSend = lines.slice(0, maxItems);
    const remaining = lines.slice(maxItems);
    const results = new Array(toSend.length).fill(false);
    let done = 0;

    for (let i = 0; i < toSend.length; i++) {
      httpPost(apiUrl, token, toSend[i], 3000, (ok) => {
        results[i] = ok;
        done++;
        if (done === toSend.length) {
          try {
            const failed = toSend.filter((_, idx) => !results[idx]);
            const kept = [...failed, ...remaining];
            if (kept.length === 0) {
              fs.unlinkSync(qPath);
            } else {
              fs.writeFileSync(qPath, kept.join("\\n") + "\\n");
            }
          } catch {}
        }
      });
    }
  } catch {}
}

function httpPostSingle(apiUrl, token, data, timeoutMs, callback) {
  try {
    const url = new URL(apiUrl + "/api/usage/submit");
    if (url.protocol !== "https:") { callback(false); return; }
    const mod = https;
    const req = mod.request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      timeout: timeoutMs,
    }, (res) => {
      res.on("data", () => {});
      res.on("end", () => callback(res.statusCode >= 200 && res.statusCode < 300));
    });
    req.on("timeout", () => { req.destroy(); callback(false); });
    req.on("error", () => callback(false));
    req.write(data);
    req.end();
  } catch { callback(false); }
}

function httpPost(apiUrl, token, data, timeoutMs, callback) {
  httpPostSingle(apiUrl, token, data, timeoutMs, (ok) => {
    if (ok) { callback(true); return; }
    // Primary failed — try fallback URLs
    const remaining = FALLBACK_URLS.filter((u) => u !== apiUrl);
    let i = 0;
    function next() {
      if (i >= remaining.length) { callback(false); return; }
      const candidate = remaining[i++];
      httpPostSingle(candidate, token, data, timeoutMs, (ok2) => {
        if (ok2) {
          // Update api_url for future calls
          try {
            const configDir = path.join(os.homedir(), ".config", "ai-camp");
            fs.writeFileSync(path.join(configDir, "api_url"), candidate);
          } catch {}
          callback(true);
        } else {
          next();
        }
      });
    }
    next();
  });
}

function selfUpdate(apiUrl) {
  try {
    const configDir = path.join(os.homedir(), ".config", "ai-camp");
    const lastUpdateFile = path.join(configDir, ".last-update-codex");
    const today = new Date().toISOString().slice(0, 10);
    const lastUpdate = fs.existsSync(lastUpdateFile) ? fs.readFileSync(lastUpdateFile, "utf8").trim() : "";
    if (lastUpdate === today) return;

    const url = new URL(apiUrl + "/api/hook-script-codex");
    const mod = url.protocol === "https:" ? https : http;
    const req = mod.get(url, (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => {
        try {
          const crypto = require("crypto");
          const serverHash = res.headers["x-script-hash"];
          const bodyHash = crypto.createHash("sha256").update(body).digest("hex");
          if (serverHash && serverHash !== bodyHash) return;
          if (res.statusCode === 200 && body.length > 100) {
            const selfPath = path.join(configDir, "report-usage-codex.js");
            const current = fs.existsSync(selfPath) ? fs.readFileSync(selfPath, "utf8") : "";
            if (body.trim() !== current.trim()) {
              fs.writeFileSync(selfPath, body);
            }
          }
          // URL migration: server가 canonical URL을 내려주면 api_url 자동 갱신
          const canonicalUrl = res.headers["x-canonical-url"];
          if (canonicalUrl && canonicalUrl !== apiUrl) {
            const urlPath = path.join(configDir, "api_url");
            fs.writeFileSync(urlPath, canonicalUrl);
          }
          // hooks.json 정비 + PostToolUse 자동 등록
          const codexDir = path.join(os.homedir(), ".codex");
          const hooksPath = path.join(codexDir, "hooks.json");
          if (fs.existsSync(hooksPath)) {
            const raw = JSON.parse(fs.readFileSync(hooksPath, "utf8"));
            let changed = false;
            // New format: { hooks: { Stop: [...], SessionStart: [...] } }
            const s = raw.hooks ? raw : { hooks: raw };
            if (!s.hooks) s.hooks = {};
            const hookPath = path.join(os.homedir(), ".config", "ai-camp", "report-usage-codex.js");
            const cmd = "node " + hookPath;

            // Ensure PostToolUse hook exists
            if (!s.hooks.PostToolUse) s.hooks.PostToolUse = [];
            const hasPTU = s.hooks.PostToolUse.some(function(h) {
              return h.hooks && h.hooks.some(function(hh) {
                return hh.command && hh.command.includes("ai-camp/report-usage-codex");
              });
            });
            if (!hasPTU) {
              s.hooks.PostToolUse.push({ matcher: null, hooks: [{ type: "command", command: cmd, timeout: 5 }] });
              changed = true;
            }

            // Fix matcher on existing hooks
            for (const hookType of ["Stop", "SessionStart", "PostToolUse"]) {
              if (!s.hooks[hookType]) continue;
              for (const entry of s.hooks[hookType]) {
                if (entry.hooks) {
                  for (const hh of entry.hooks) {
                    if (hh.command && hh.command.includes("ai-camp/report-usage-codex") && entry.matcher !== null && entry.matcher !== ".*") {
                      entry.matcher = null;
                      changed = true;
                    }
                  }
                }
              }
            }
            if (changed) fs.writeFileSync(hooksPath, JSON.stringify(raw.hooks ? raw : s, null, 2));
          }
          fs.writeFileSync(lastUpdateFile, today);
        } catch {}
      });
    });
    req.setTimeout(3000, () => req.destroy());
    req.on("error", () => {});
  } catch {}
}

let input = "";
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  try {
    const event = JSON.parse(input);
    const configDir = path.join(os.homedir(), ".config", "ai-camp");

    // 토큰/URL이 없으면 setup 미완료 — 종료
    const tokenPath = path.join(configDir, "token");
    const urlPath = path.join(configDir, "api_url");
    if (!fs.existsSync(tokenPath) || !fs.existsSync(urlPath)) process.exit(0);

    const token = fs.readFileSync(tokenPath, "utf8").trim();
    const savedApiUrl = fs.readFileSync(urlPath, "utf8").trim();

    const hookEvent = event.hook_event_name || "";

    // PostToolUse: 30분 스로틀 — 미경과 시 즉시 종료
    if (hookEvent === "PostToolUse") {
      if (shouldThrottle()) process.exit(0);
    }

    // URL 복구 후 나머지 로직 실행
    checkAndFixApiUrl(savedApiUrl, (apiUrl) => {

    // SessionStart: 큐 drain + self-update만 수행하고 종료
    if (hookEvent === "SessionStart") {
      selfUpdate(apiUrl);
      drainQueue(apiUrl, token, 20);
      setTimeout(() => process.exit(0), 4000);
      return;
    }

    const transcriptPath = event.transcript_path;
    const sessionId = event.session_id;
    const eventModel = event.model || "";
    if (!transcriptPath || !fs.existsSync(transcriptPath)) {
      // No transcript — still try self-update and queue drain
      selfUpdate(apiUrl);
      drainQueue(apiUrl, token, 20);
      setTimeout(() => process.exit(0), 4000);
      return;
    }

    // Trigger self-update (async, non-blocking)
    selfUpdate(apiUrl);

    // 이전 실패분 drain (최대 10건, 비동기)
    drainQueue(apiUrl, token, 10);

    // Parse JSONL transcript — find last token_count event for cumulative totals
    const lines = fs.readFileSync(transcriptPath, "utf8").split("\\n").filter(Boolean);
    let totalInput = 0;
    let totalOutput = 0;
    let totalCacheRead = 0;
    let totalCost = 0;
    const modelsSet = new Set();

    // Codex JSONL: look for { "type": "token_count", "info": { "total_token_usage": { ... } } }
    // Use the LAST token_count event — it has cumulative totals
    let lastTokenCount = null;
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.type === "token_count" && entry.info && entry.info.total_token_usage) {
          lastTokenCount = entry.info.total_token_usage;
        }
      } catch {}
    }

    if (lastTokenCount) {
      totalInput = lastTokenCount.input_tokens || 0;
      totalOutput = lastTokenCount.output_tokens || 0;
      totalCacheRead = lastTokenCount.cached_input_tokens || 0;
      // input_tokens from Codex includes cached — subtract to get non-cached input
      totalInput = Math.max(0, totalInput - totalCacheRead);
    }

    if (eventModel) modelsSet.add(eventModel);

    // Calculate cost
    const p = getPrice(eventModel);
    totalCost = (totalInput * p.input + totalOutput * p.output + totalCacheRead * p.cache_read) / 1000000;

    // 커밋/PR: 본인 커밋만 카운트 (git config user.email 기준)
    const { execFileSync } = require("child_process");
    let commits = 0;
    let pullRequests = 0;
    try {
      const cwd = event.cwd || process.cwd();
      const todayForGit = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
      let gitEmail = "";
      try { gitEmail = execFileSync("git", ["config", "user.email"], { cwd, timeout: 2000, stdio: ["pipe", "pipe", "pipe"] }).toString().trim(); } catch { gitEmail = ""; }
      const gitArgs = ["log", "--oneline", "--since=" + todayForGit];
      if (gitEmail) gitArgs.push("--author=" + gitEmail);
      try { commits = parseInt(execFileSync("git", gitArgs, { cwd, timeout: 3000, stdio: ["pipe", "pipe", "pipe"] }).toString().split("\\n").filter(Boolean).length.toString(), 10) || 0; } catch { commits = 0; }
    } catch { commits = 0; }
    try {
      const cwd = event.cwd || process.cwd();
      let gitEmail = "";
      try { gitEmail = execFileSync("git", ["config", "user.email"], { cwd, timeout: 2000, stdio: ["pipe", "pipe", "pipe"] }).toString().trim(); } catch { gitEmail = ""; }
      const prArgs = ["log", "--oneline", "--all", "--grep=Merge pull request", "--since=1 week ago"];
      if (gitEmail) prArgs.push("--author=" + gitEmail);
      try { pullRequests = parseInt(execFileSync("git", prArgs, { cwd, timeout: 3000, stdio: ["pipe", "pipe", "pipe"] }).toString().split("\\n").filter(Boolean).length.toString(), 10) || 0; } catch { pullRequests = 0; }
    } catch { pullRequests = 0; }

    const totalTokens = totalInput + totalOutput + totalCacheRead;
    if (totalTokens === 0) process.exit(0);

    // Delta 계산: resumed 세션은 이전 제출분을 빼고 새 사용량만 제출
    const cache = loadSessionCache();
    const prev = (sessionId && cache[sessionId]) || { inp: 0, out: 0, cw: 0, cr: 0, cost: 0, commits: 0, prs: 0, n: 0 };

    const deltaInput = Math.max(0, totalInput - prev.inp);
    const deltaOutput = Math.max(0, totalOutput - prev.out);
    const deltaCacheRead = Math.max(0, totalCacheRead - prev.cr);
    const deltaCost = Math.max(0, totalCost - prev.cost);
    const deltaTotal = deltaInput + deltaOutput + deltaCacheRead;

    if (deltaTotal <= 0) process.exit(0);

    // 캐시 업데이트 (제출 전에 저장 — 실패 시 큐에서 재시도)
    if (sessionId) {
      cache[sessionId] = { inp: totalInput, out: totalOutput, cw: 0, cr: totalCacheRead, cost: totalCost, commits: commits, prs: pullRequests, n: prev.n + 1, ts: Date.now() };
      saveSessionCache(cache);
    }

    // Resumed 세션은 고유한 submission ID 사용 (서버 dedup 통과)
    const submissionId = sessionId ? (prev.n > 0 ? sessionId + "_r" + prev.n : sessionId) : null;

    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
    // 새 세션 판별: Stop hook + 첫 전송(resumed 아님)일 때만 true
    const isNewSession = hookEvent === "Stop" && prev.n === 0;

    const data = JSON.stringify({
      session_id: submissionId,
      date: today,
      cli_source: "codex",
      input_tokens: deltaInput,
      output_tokens: deltaOutput,
      cache_creation_tokens: 0,
      cache_read_tokens: deltaCacheRead,
      total_tokens: deltaTotal,
      total_cost: Math.round(deltaCost * 100) / 100,
      commits: commits,
      pull_requests: pullRequests,
      models_used: Array.from(modelsSet),
      is_new_session: isNewSession,
    });

    // 먼저 로컬 큐에 저장 (데이터 유실 방지)
    enqueue(data);

    // 서버 전송 시도 (3초 timeout)
    httpPost(apiUrl, token, data, 3000, (ok) => {
      if (ok) {
        updateLastReport();
        // 성공: 방금 넣은 항목을 content 매칭으로 제거
        try {
          const qPath = getQueuePath();
          const qLines = fs.readFileSync(qPath, "utf8").split("\\n").filter(Boolean);
          const idx = qLines.lastIndexOf(data);
          if (idx >= 0) qLines.splice(idx, 1);
          if (qLines.length === 0) {
            fs.unlinkSync(qPath);
          } else {
            fs.writeFileSync(qPath, qLines.join("\\n") + "\\n");
          }
        } catch {}
      }
      process.exit(0);
    });

    }); // checkAndFixApiUrl callback
  } catch { process.exit(0); }
});
`;
