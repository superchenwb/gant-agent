---
name: gant-upgrade
version: 1.0.0
description: |
  Upgrade gant-agent to the latest version. Checks npm registry, runs the upgrade,
  and shows what's new. Use when asked to "upgrade gant-agent", "update gant-agent",
  or "get latest version".
triggers:
  - upgrade gant-agent
  - update gant-agent
  - get latest gant-agent
  - 升级 gant-agent
  - 更新 gant-agent
allowed-tools:
  - Bash
  - Read
---

# /gant-upgrade

Upgrade gant-agent to the latest version and show what's new.

## Usage

When the user asks to upgrade or update gant-agent, follow these steps.

### Step 1: Check current version

```bash
gant --version 2>/dev/null || echo "NOT_INSTALLED"
```

If not installed, tell the user to install first: `npm install -g gant-agent`

### Step 2: Check latest version

```bash
npm view gant-agent version 2>/dev/null || echo "UNKNOWN"
```

If npm registry is unreachable, try:
```bash
curl -s https://registry.npmjs.org/-/package/gant-agent/dist-tags | grep -o '"latest":"[^"]*"' | cut -d'"' -f4
```

### Step 3: Compare versions

If current == latest: tell user "Already on latest version (v{version})."

If current < latest: proceed to Step 4.

### Step 4: Ask user confirmation (or auto-upgrade)

**Ask the user:**
> gant-agent v{new} is available (you're on v{old}). Upgrade now?
>
> Options: ["Yes, upgrade now", "Not now"]

If "Not now": stop and return to previous task.

### Step 5: Run upgrade

```bash
npm install -g gant-agent
```

If permission denied:
```bash
sudo npm install -g gant-agent
```

Or suggest using npx instead of global install.

### Step 6: Verify

```bash
gant --version
```

Confirm the new version matches.

### Step 7: Show What's New

Read the CHANGELOG from npm package or GitHub:
```bash
npm view gant-agent --json 2>/dev/null | grep -A 50 '"changelog"' || curl -s https://raw.githubusercontent.com/superchenwb/gant-agent/master/CHANGELOG.md | head -100
```

Summarize the changes between old and new version in 3-5 bullets.

Format:
```
gant-agent v{new} — upgraded from v{old}!

What's new:
- [bullet 1]
- [bullet 2]
- ...

Happy coding!
```

### Step 8: Continue

After showing What's New, continue with whatever the user originally asked.
