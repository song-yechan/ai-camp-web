export async function GET() {
  return new Response(HOOK_SCRIPT, {
    headers: { "Content-Type": "application/javascript; charset=utf-8" },
  });
}

const HOOK_SCRIPT = `const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");
const http = require("http");

// 5초 hard timeout — Claude Code 세션 종료 지연 방지
const HARD_TIMEOUT = setTimeout(() => process.exit(0), 5000);
HARD_TIMEOUT.unref();

const PRICING = {
  "claude-opus-4-6":     { input: 15, output: 75, cache_write: 18.75, cache_read: 1.50 },
  "claude-sonnet-4-6":   { input: 3, output: 15, cache_write: 3.75, cache_read: 0.30 },
  "claude-haiku-4-5":    { input: 0.80, output: 4, cache_write: 1, cache_read: 0.08 },
};

function getPrice(model) {
  if (!model) return PRICING["claude-sonnet-4-6"];
  for (const [key, price] of Object.entries(PRICING)) {
    if (model.includes(key) || model.startsWith(key.replace(/-\\d+$/, ""))) return price;
  }
  if (model.includes("opus")) return PRICING["claude-opus-4-6"];
  if (model.includes("haiku")) return PRICING["claude-haiku-4-5"];
  return PRICING["claude-sonnet-4-6"];
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

function httpPost(apiUrl, token, data, timeoutMs, callback) {
  try {
    const url = new URL(apiUrl + "/api/usage/submit");
    const mod = url.protocol === "https:" ? https : http;
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

function selfUpdate(apiUrl) {
  try {
    const configDir = path.join(os.homedir(), ".config", "ai-camp");
    const lastUpdateFile = path.join(configDir, ".last-update");
    const today = new Date().toISOString().slice(0, 10);
    const lastUpdate = fs.existsSync(lastUpdateFile) ? fs.readFileSync(lastUpdateFile, "utf8").trim() : "";
    if (lastUpdate === today) return;

    const url = new URL(apiUrl + "/api/hook-script");
    const mod = url.protocol === "https:" ? https : http;
    const req = mod.get(url, (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => {
        try {
          if (res.statusCode === 200 && body.length > 100) {
            const selfPath = path.join(configDir, "report-usage.js");
            const current = fs.existsSync(selfPath) ? fs.readFileSync(selfPath, "utf8") : "";
            if (body.trim() !== current.trim()) {
              fs.writeFileSync(selfPath, body);
            }
          }
          const settingsPath = path.join(os.homedir(), ".claude", "settings.json");
          if (fs.existsSync(settingsPath)) {
            const settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
            if (settings.hooks && settings.hooks.Stop) {
              let fixed = false;
              for (const entry of settings.hooks.Stop) {
                const isAiCamp = entry.hooks && entry.hooks.some((h) => h.command && h.command.includes("ai-camp/report-usage"));
                if (isAiCamp && entry.matcher !== ".*") {
                  entry.matcher = ".*";
                  fixed = true;
                }
              }
              if (fixed) fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
            }
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
    const transcriptPath = event.transcript_path;
    const sessionId = event.session_id;
    if (!transcriptPath || !fs.existsSync(transcriptPath)) process.exit(0);

    const configDir = path.join(os.homedir(), ".config", "ai-camp");
    const token = fs.readFileSync(path.join(configDir, "token"), "utf8").trim();
    const apiUrl = fs.readFileSync(path.join(configDir, "api_url"), "utf8").trim();

    // Trigger self-update (async, non-blocking)
    selfUpdate(apiUrl);

    // 이전 실패분 drain (최대 10건, 비동기)
    drainQueue(apiUrl, token, 10);

    const lines = fs.readFileSync(transcriptPath, "utf8").split("\\n").filter(Boolean);
    let totalInput = 0;
    let totalOutput = 0;
    let totalCacheCreate = 0;
    let totalCacheRead = 0;
    let totalCost = 0;
    let commits = 0;
    let pullRequests = 0;
    const modelsSet = new Set();

    // 2-pass: 먼저 tool_use ID → 명령어 매핑, 그 다음 tool_result로 성공 여부 확인
    const commitToolIds = new Set();
    const prToolIds = new Set();
    const toolResults = new Map(); // tool_use_id → success boolean

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);

        if (entry.type === "assistant") {
          const usage = entry.message && entry.message.usage;
          const model = entry.message && entry.message.model;
          if (usage) {
            const inp = usage.input_tokens || 0;
            const out = usage.output_tokens || 0;
            const cw = usage.cache_creation_input_tokens || 0;
            const cr = usage.cache_read_input_tokens || 0;
            totalInput += inp;
            totalOutput += out;
            totalCacheCreate += cw;
            totalCacheRead += cr;
            const p = getPrice(model);
            totalCost += (inp * p.input + out * p.output + cw * p.cache_write + cr * p.cache_read) / 1000000;
          }
          if (model) modelsSet.add(model);

          const content = entry.message && entry.message.content;
          if (Array.isArray(content)) {
            for (const block of content) {
              if (block.type === "tool_use" && block.name === "Bash" && block.id) {
                const cmd = (block.input && block.input.command) || "";
                if (/git\\s+commit/i.test(cmd)) commitToolIds.add(block.id);
                if (/gh\\s+pr\\s+create/i.test(cmd)) prToolIds.add(block.id);
              }
            }
          }
        }

        // tool_result: exit code 0 = 성공
        if (entry.type === "tool" && entry.message && entry.message.content) {
          const tc = entry.message.content;
          if (Array.isArray(tc)) {
            for (const block of tc) {
              if (block.tool_use_id) {
                // exit code 0이면 성공 (에러 없음 = 성공)
                const isError = block.is_error === true;
                toolResults.set(block.tool_use_id, !isError);
              }
            }
          }
        }
      } catch {}
    }

    // 성공한 tool_use만 카운트
    for (const id of commitToolIds) {
      if (toolResults.get(id) !== false) commits++;
    }
    for (const id of prToolIds) {
      if (toolResults.get(id) !== false) pullRequests++;
    }

    const totalTokens = totalInput + totalOutput + totalCacheCreate + totalCacheRead;
    if (totalTokens === 0) process.exit(0);

    // Delta 계산: resumed 세션은 이전 제출분을 빼고 새 사용량만 제출
    const cache = loadSessionCache();
    const prev = (sessionId && cache[sessionId]) || { inp: 0, out: 0, cw: 0, cr: 0, cost: 0, commits: 0, prs: 0, n: 0 };

    const deltaInput = Math.max(0, totalInput - prev.inp);
    const deltaOutput = Math.max(0, totalOutput - prev.out);
    const deltaCacheCreate = Math.max(0, totalCacheCreate - prev.cw);
    const deltaCacheRead = Math.max(0, totalCacheRead - prev.cr);
    const deltaCost = Math.max(0, totalCost - prev.cost);
    const deltaTotal = deltaInput + deltaOutput + deltaCacheCreate + deltaCacheRead;

    const deltaCommits = Math.max(0, commits - (prev.commits || 0));
    const deltaPRs = Math.max(0, pullRequests - (prev.prs || 0));

    if (deltaTotal <= 0 && deltaCommits <= 0 && deltaPRs <= 0) process.exit(0);

    // 캐시 업데이트 (제출 전에 저장 — 실패 시 큐에서 재시도)
    if (sessionId) {
      cache[sessionId] = { inp: totalInput, out: totalOutput, cw: totalCacheCreate, cr: totalCacheRead, cost: totalCost, commits: commits, prs: pullRequests, n: prev.n + 1, ts: Date.now() };
      saveSessionCache(cache);
    }

    // Resumed 세션은 고유한 submission ID 사용 (서버 dedup 통과)
    const submissionId = sessionId ? (prev.n > 0 ? sessionId + "_r" + prev.n : sessionId) : null;

    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
    const data = JSON.stringify({
      session_id: submissionId,
      date: today,
      input_tokens: deltaInput,
      output_tokens: deltaOutput,
      cache_creation_tokens: deltaCacheCreate,
      cache_read_tokens: deltaCacheRead,
      total_tokens: deltaTotal,
      total_cost: Math.round(deltaCost * 100) / 100,
      commits: deltaCommits,
      pull_requests: deltaPRs,
      models_used: Array.from(modelsSet),
    });

    // 먼저 로컬 큐에 저장 (데이터 유실 방지)
    enqueue(data);

    // 서버 전송 시도 (3초 timeout)
    httpPost(apiUrl, token, data, 3000, (ok) => {
      if (ok) {
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
      // 실패해도 큐에 남아있으므로 다음 세션에서 재시도
      process.exit(0);
    });
  } catch { process.exit(0); }
});
`;
