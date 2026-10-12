@AGENTS.md

# Claude Code notes

Source of truth for steering, skills and agents is `.kiro/` (the user works mostly in Kiro). Never replace the Claude-side symlinks with copies:

- `.claude/skills`, `.claude/agents` and `.mcp.json` are symlinks into `.kiro/`.

Read on demand (not imported, to keep context small):

- `.kiro/steering/code-conventions.md` – when making non-trivial code changes
- `.kiro/steering/tech.md` – when making technology decisions
- `.kiro/steering/structure.md` — before adding/moving files, routes, components, or seasons, and before DB/migration work.
- `.kiro/steering/design.md` — before any UI or styling work.
- `.kiro/steering/product.md` — before feature-scope or roadmap decisions.
- `TODO.md` — active expansion plan.

Project skills (in `.kiro/skills/`, usable here): `seed-a-season`, `update-steering`, `grill-me`, `supabase`, `supabase-postgres-best-practices`, etc. When updating steering docs, edit `.kiro/steering/`.
