---
name: update-kickstart
description: Update AI steering docs and skills when a new kickstart version is available. Use when the user wants to update their AI tooling setup, check if their steering docs are current, or mentions kickstart updates.
---

# Update Kickstart

Update this repository's AI steering docs and tooling to the latest kickstart version.

## Kickstart source

- Prompt & templates: `https://kickstart.md/` (raw skill/template files are served
  from the source repo: `https://raw.githubusercontent.com/itzjacki/kickstart.md/main/`)
- Changelog: `https://raw.githubusercontent.com/itzjacki/kickstart.md/main/CHANGELOG.md`

## Principles

- **Preserve manual edits.** The user may have customized their steering files. Never overwrite without showing what would change and getting confirmation.
- **Show what changed.** Summarize version differences in plain language before doing anything. The user should understand what they're getting.
- **Ask before destructive changes.** Adding new files is low-risk. Modifying or removing files the user may have edited requires explicit confirmation.
- **Always recommend.** When presenting options, provide a clear recommendation with reasoning. Don't leave the user to decide blind.
- **Be concise.** The already-current case should be one sentence. The update-available case should fit on a single screen. Don't pad.
- **One version at a time is fine.** Apply all changes between current and latest in one pass, but present them grouped by version so the user understands the progression.

## How it works

1. Find the current version stamp (`<!-- kickstart-version: N -->` in `AGENTS.md`)
2. Read `CHANGELOG.md` from the kickstart repo to see what changed since that version
3. Summarize the changes and ask the user if they want to apply them
4. Apply changes, preserving manual edits
5. Update the version stamp

## What good output looks like

**When updates are available:**

> Your steering docs are on kickstart v1. Latest is v3. Here's what changed:
>
> **v2:** Added `update-steering` skill (`.kiro/skills/update-steering/`), added testing-standards to `tech.md`
> **v3:** Revised skill format, removed deprecated `lint-fix` template
>
> Want me to apply these? I'll preserve any manual edits you've made.

**When already current:**

> You're on kickstart v3 — that's the latest. Nothing to update.

**When a conflict exists (file was manually edited AND the update changes it):**

> `structure.md` was updated in v2 (adds a "Conventions" section), but you've edited it manually — your naming convention notes overlap with the new section. Here are your options:
>
> 1. **Structural alignment** — keep your content, wrap it under the new "Conventions" heading for v2 compatibility
> 2. **Full merge** — combine the template's section with your notes, removing duplicates
> 3. **Skip** — leave your file untouched, apply all other v2 changes
>
> I'd recommend option 1 — your notes already cover the intent, they just need the heading for structural consistency.

Identify the conflict, explain consequences, offer options, recommend one.

## Applying changes

For each changelog entry between current and latest:

- **ADDED** items: generate the new file or section from the kickstart templates. Mention the target path (e.g., `.kiro/skills/skill-name/`).
- **CHANGED** items: update the relevant file, merging with manual edits. If the merge is ambiguous, show both versions and ask.
- **REMOVED/DEPRECATED** items: if the file was manually edited, confirm before removing. If untouched, remove silently.

After applying, update `<!-- kickstart-version: N -->` in `AGENTS.md` to the new version.

## Where to find templates

New skills and steering files referenced in the changelog come from the kickstart repo's `templates/` directory. If the templates are available locally (e.g., cloned repo), use the local copy. Fall back to `https://kickstart.md/templates/` (or the GitHub raw URL above for individual skill files) only if local files aren't available.
