---
name: update-steering
description: Update AI steering docs after codebase changes. Use when the user has made changes to the code (new features, refactors, dependency changes, structural changes) and wants to keep steering docs accurate. Trigger when the user mentions updating docs, syncing docs, or says their steering files are out of date.
---

# Update Steering

Keep the repository's AI steering docs accurate after codebase changes.

## Principles

These guide every decision. When in doubt, refer back here:

- **Minimal edits only.** Touch only what's actually stale. Don't rewrite docs that are still accurate.
- **Preserve voice.** Match the existing writing style in each file. Don't homogenize or reformat.
- **Show your work.** Always explain what you checked and what you found — especially when the answer is "nothing needs changing."
- **Decisions matter more than diffs.** A new dependency is obvious from a diff. A new architectural decision, a new domain, a new workflow — these are what steering docs exist to capture. Look for them actively.
- **Ask before editing.** Summarize proposed changes and get confirmation before modifying files.
- **Early-exit when appropriate.** If the situation doesn't call for updates (wrong repo, nothing stale, no steering files exist), don't perform empty ceremony. But early-exit means skipping pointless process steps — not withholding helpful information. If you can preview what changes would be needed in the right context, do so.

## What to investigate

Look beyond file-level diffs. The goal is to find things that would mislead a future AI agent reading the steering docs:

- **New project decisions** — new tools, frameworks, services, domains, deployment targets, workflow changes
- **Structural shifts** — new directories, moved modules, renamed patterns, changed conventions
- **Removed or replaced things** — dependencies dropped, patterns abandoned, features removed
- **Uncommitted and untracked work** — the working tree often contains changes not yet in git history

Use git history, the working tree, and the user's description (if they gave one) to build a complete picture. Don't limit yourself to a single git command.

## Steering files to check

- `AGENTS.md` — project overview, key decisions, conventions
- `.kiro/steering/tech.md` — tech stack
- `.kiro/steering/structure.md` — code structure and conventions
- `.kiro/steering/product.md` — product description

If a file doesn't exist, skip it. Don't create new files unless the user asks.

## What good output looks like

**When changes are found:**

> I checked git history and the working tree against your steering docs. Here's what's stale:
>
> - `tech.md`: Still lists Express, but you've switched to Fastify
> - `AGENTS.md`: Missing the new caching layer decision
>
> Want me to apply these updates?

Concise, specific, actionable. List what's stale and why, then ask.

**When nothing needs changing:**

> I reviewed your steering docs against recent changes (checked git log, working tree, read AGENTS.md and tech.md). Everything is still accurate — no updates needed.
>
> If you'd like me to add coverage for [something not currently documented], let me know.

Show what you checked so the user trusts the review happened. Offer next steps.

**When the request doesn't apply (wrong repo, no steering files):**

> This repo doesn't have steering docs that reference [what the user mentioned]. Are you in the right directory?
>
> If you re-run this in the correct repo, here's what I'd update based on your description:
>
> - `tech.md`: Replace Express with Fastify, note the plugin system
> - `structure.md`: Add the new `src/middleware/` directory
> - `AGENTS.md`: Update framework references

Identify the mismatch, then preview what the update would look like so the user isn't left empty-handed.
