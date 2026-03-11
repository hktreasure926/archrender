---
trigger: always_on
---

# AI Boot Sequence & Context Rules

**CRITICAL:** Before starting any new task, development phase, or when joining a new conversation, you MUST ALWAYS execute the following "Boot Sequence":

1. **Check Debug Logs & Guidelines First:** Start by thoroughly checking the `docs/Debug/` folder (such as `docs/Debug/combined-phase2-debug-log.md`) to avoid recreating past bugs (like hydration errors or UI clipping constraints).
2. **Follow Localhost Checklist:** Refer to `Localhost run checklist.md` for proper procedures on managing the development server and understanding the current state of the application.
3. **Review Phase Documents:** Identify and read the current active Phase documents (e.g., `docs/PHASE2B_IMPLEMENTATION_PLAN.md` or `docs/PHASE2B_GUIDE.md`) to understand immediate objectives before making structural changes.

# UI/UX & Iteration Workflow Rules

1. **Verify UI Changes Visually:** Do not assume a React/Tailwind change worked perfectly. When fixing layout, clipping, or styling bugs, use the browser subagent to take a screenshot and explicitly verify the layout bounds.
2. **Beware of Development Caching (HMR):** Next.js aggressively caches structural React elements. If you make a significant structural layout change (like removing a wrapper or accordion) and the UI still looks broken, you must explicitly kill the dev server processes (e.g., `lsof -i :3000 -t | xargs kill -9`) and restart `npm run dev` to flush the cache.
3. **Top-Down Layout Debugging:** When a component is unexpectedly clipping or hiding content, start by checking parent wrappers for `overflow-hidden`, hardcoded `max-h-[]`, or flex/grid constraints, rather than just inspecting the child component itself.

4. Each time after doing debugging, please log in the debug log into the doc/Debug folder
