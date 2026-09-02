# Show your AI agent's activity in Viora 🧑‍🍳

A Claude Code hook that broadcasts what your agent is working on to everyone in your
current Viora space. Others see a live **"What agents are cooking"** feed panel and a
pulsing badge above your avatar while the agent works — and the badge clears when the
agent finishes.

## One-time setup

### 1. Get your Viora token

1. Sign in at [https://vioraa.tech](https://vioraa.tech)
2. Open DevTools → Application → Local Storage → `https://vioraa.tech`
3. Copy the value of the key `metaverse:token`

> The token expires after 7 days — repeat this step when the feed stops updating.

### 2. Save your config

Create `~/.viora/agent.json`:

```json
{
  "token": "PASTE_YOUR_TOKEN_HERE",
  "apiUrl": "https://api.vioraa.tech"
}
```

(For local development use `"apiUrl": "http://localhost:3001"`.)

### 3. Register the hook with Claude Code

Add this to `~/.claude/settings.json` (merge with existing content, don't replace it):

```json
{
  "hooks": {
    "PreToolUse": [
      { "hooks": [{ "type": "command", "command": "node /PATH/TO/2D-Metaverse/tools/agent-hook/viora-agent-hook.mjs" }] }
    ],
    "PostToolUse": [
      { "hooks": [{ "type": "command", "command": "node /PATH/TO/2D-Metaverse/tools/agent-hook/viora-agent-hook.mjs" }] }
    ],
    "Stop": [
      { "hooks": [{ "type": "command", "command": "node /PATH/TO/2D-Metaverse/tools/agent-hook/viora-agent-hook.mjs" }] }
    ],
    "SessionEnd": [
      { "hooks": [{ "type": "command", "command": "node /PATH/TO/2D-Metaverse/tools/agent-hook/viora-agent-hook.mjs" }] }
    ]
  }
}
```

Replace `/PATH/TO/2D-Metaverse` with the absolute path of this repo on your machine.

### 4. Test it

1. Open a Viora space in your browser (stay in it)
2. Start any Claude Code session and give it a task
3. Watch the 🧑‍🍳 feed panel and the badge above your avatar

## How it behaves

- While Claude runs tools (edits, bash commands…) your badge shows "cooking" with a short
  description of the current tool (e.g. `Claude is using Edit page.tsx`)
- When Claude finishes, the badge clears automatically
- If you're not inside a Viora space, updates are silently dropped
- Updates are throttled (2s) so fast tool bursts don't spam the room
- The script never blocks or fails your agent session — all errors are swallowed

## Privacy notes

Only the tool name and a short snippet (file name / truncated command) are sent — never
file contents, prompts, or code. Clear the config (`~/.viora/agent.json`) to disable
broadcasting entirely.
