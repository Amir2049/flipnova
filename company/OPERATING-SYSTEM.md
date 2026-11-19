# FLIPNOVA operating system (الإدارة الصارمة)

The acting CEO is the `flipnova-ceo` agent. Supporting skills now in `.claude/skills/`:
ceo-advisor, coo-advisor, cmo-advisor, cfo-advisor, cpo-advisor, chief-of-staff, company-os, decision-logger,
strategic-alignment, scenario-war-room, board-meeting, founder-coach, founder-mode, decide, execute, boardroom,
retrospective (clevel-retrospective), gstack-plan-ceo-review, gstack-retro, gstack-office-hours, gstack-autoplan.
(MIT: alirezarezvani/claude-skills, garrytan/gstack; licences in .claude/licenses/.)

## North Star
**Weekly returning players** (players with a run in 2 different weeks). Until Google Play analytics exist we use the
leaderboard (only named players, so it undercounts — say that next to the number).

## Scorecard (every Sunday)
| Metric | Source | Target by 31 Dec 2026 |
|---|---|---|
| Players with a run this week | leaderboard / Supabase read-only | 50 |
| Returning players this week | leaderboard | 15 |
| Runs per day (7-day avg) | leaderboard | 30 |
| TikTok videos posted this week | marketing/state/video-results.md | 3 (board decision 3 Nov) |
| Best video 2 s view rate / avg watch | same | 60% / 10 s |
| Builds shipped to Amir this week | releases/ | 5 |
| Google Play readiness | company/google-play-kit.md checklist | 100% before Feb 2027 |
Targets are a first guess; the CEO adjusts them once real numbers exist, and writes why.

## Rhythm
- **Daily 4:17 Cairo:** the team worker session ships one task + one TikTok video (company/AUTOPILOT.md).
- **Sunday's run:** instead of a feature, the CEO runs the weekly review (`flipnova-ceo`), updates ROADMAP,
  logs decisions with decision-logger, and gives Amir his 3 to-dos.
- **1st of each month:** board meeting (board-meeting skill): CEO, CMO, CFO, CPO argue the month's plan, Amir decides.

## Rules
WIP ≤ 3 · owner + due date + "done means" on every task · kill after 2 weeks late or 2 failed tries ·
evidence-only numbers · hard rules (no ads in game, no music, no religious symbols, game stays hard, no server
publishing without Amir's explicit words, owner code never in git).

## What no tool can guarantee
Success isn't guaranteed by any skill. What this system guarantees is that every week you know the real numbers,
the work never stops, and bad bets get killed fast.
