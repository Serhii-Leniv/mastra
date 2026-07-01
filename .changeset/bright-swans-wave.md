---
'mastracode': patch
---

Fixed TUI height corruption when switching threads or creating new conversations. The pi-tui differential rendering cache (previousLines, maxLinesRendered, cursor positions) was not reset on thread switch, causing stale state to produce incorrect height calculations that persisted for the entire session. Now forces a full TUI redraw and cleans up orphaned streaming state on every thread transition.
