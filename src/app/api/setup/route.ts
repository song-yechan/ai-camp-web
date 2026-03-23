export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const script = SETUP_SCRIPT_TEMPLATE.split("__APP_URL__").join(appUrl);

  return new Response(script, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

// NOTE: In JS template literals, only `${` triggers interpolation.
// Bare `$VAR` is emitted literally. We escape `${...}` with `\${...}`.
const SETUP_SCRIPT_TEMPLATE = `#!/bin/bash
set -e

APP_URL="__APP_URL__"
TOKEN="\${1:-}"
CONFIG_DIR="$HOME/.config/ai-camp"
CLAUDE_SETTINGS="$HOME/.claude/settings.json"

echo ""
echo "  AI Native Camp - CLI Setup"
echo "  =========================="
echo ""

# --------------------------------------------------
# 1. Validate token
# --------------------------------------------------
if [ -z "$TOKEN" ]; then
  echo "  ERROR: Token is required."
  echo "  Usage: curl -sL \\"$APP_URL/api/setup\\" | bash -s -- <your_token>"
  exit 1
fi

if [[ "$TOKEN" != aicamp_* ]]; then
  echo "  ERROR: Invalid token format. Token must start with 'aicamp_'."
  exit 1
fi

echo "  [1/5] Token validated"

# --------------------------------------------------
# 2. Save config files
# --------------------------------------------------
mkdir -p "$CONFIG_DIR"

echo -n "$TOKEN" > "$CONFIG_DIR/token"
chmod 600 "$CONFIG_DIR/token"

echo -n "$APP_URL" > "$CONFIG_DIR/api_url"

echo "  [2/5] Config saved to $CONFIG_DIR"

# --------------------------------------------------
# 3. Download hook script
# --------------------------------------------------
curl -sL "$APP_URL/api/hook-script" -o "$CONFIG_DIR/report-usage.js"
chmod 644 "$CONFIG_DIR/report-usage.js"

echo "  [3/5] Hook script downloaded"

# --------------------------------------------------
# 4. Register Stop hook in Claude settings
# --------------------------------------------------
mkdir -p "$HOME/.claude"

if [ ! -f "$CLAUDE_SETTINGS" ]; then
  echo '{}' > "$CLAUDE_SETTINGS"
fi

node -e "
const fs = require('fs');
const f = process.env.HOME + '/.claude/settings.json';
const s = JSON.parse(fs.readFileSync(f, 'utf8'));
if (!s.hooks) s.hooks = {};
if (!s.hooks.Stop) s.hooks.Stop = [];
const hookPath = process.env.HOME + '/.config/ai-camp/report-usage.js';
const idx = s.hooks.Stop.findIndex(function(h) {
  return h.hooks && h.hooks.some(function(hh) {
    return hh.command && hh.command.includes('ai-camp/report-usage');
  });
});
var stopEntry = { matcher: '.*', hooks: [{ type: 'command', command: 'node ' + hookPath }] };
if (idx >= 0) {
  s.hooks.Stop[idx] = stopEntry;
} else {
  s.hooks.Stop.push(stopEntry);
}

// SessionStart hook (큐 drain + self-update)
if (!s.hooks.SessionStart) s.hooks.SessionStart = [];
var ssIdx = s.hooks.SessionStart.findIndex(function(h) {
  return h.hooks && h.hooks.some(function(hh) {
    return hh.command && hh.command.includes('ai-camp/report-usage');
  });
});
var ssEntry = { matcher: '.*', hooks: [{ type: 'command', command: 'node ' + hookPath, timeout: 5 }] };
if (ssIdx >= 0) {
  s.hooks.SessionStart[ssIdx] = ssEntry;
} else {
  s.hooks.SessionStart.push(ssEntry);
}

// PostToolUse hook (30분 간격 중간 전송)
if (!s.hooks.PostToolUse) s.hooks.PostToolUse = [];
var ptuIdx = s.hooks.PostToolUse.findIndex(function(h) {
  return h.hooks && h.hooks.some(function(hh) {
    return hh.command && hh.command.includes('ai-camp/report-usage');
  });
});
var ptuEntry = { matcher: '.*', hooks: [{ type: 'command', command: 'node ' + hookPath, timeout: 5 }] };
if (ptuIdx >= 0) {
  s.hooks.PostToolUse[ptuIdx] = ptuEntry;
} else {
  s.hooks.PostToolUse.push(ptuEntry);
}

fs.writeFileSync(f, JSON.stringify(s, null, 2) + '\\n');
"

echo "  [4/5] Claude hooks registered (Stop + SessionStart + PostToolUse)"

# --------------------------------------------------
# 5. Call onboard API
# --------------------------------------------------
ONBOARD_STATUS=\$(curl -s -o /dev/null -w "%\{http_code}" \\
  -X POST "$APP_URL/api/usage/onboard" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $TOKEN")

if [ "$ONBOARD_STATUS" = "200" ] || [ "$ONBOARD_STATUS" = "201" ]; then
  echo "  [5/5] Registered on leaderboard"
else
  echo "  [5/5] Onboard API returned status $ONBOARD_STATUS (non-fatal)"
fi

echo ""
echo "  Setup complete!"
echo "  Your Claude Code usage will now be tracked on the leaderboard."
echo ""
`;
