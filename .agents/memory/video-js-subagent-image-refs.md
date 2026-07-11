---
name: video-js subagent image references
description: Design subagents building video-js artifacts sometimes reference image assets in scene JSX that were never generated or copied into public/images.
---

After a design subagent finishes a video-js build, its scenes may `src={...}/images/foo.jpg` for files that don't exist on disk (e.g. it names an asset in the plan but forgets to run the generation/copy step, or forgets a reused-asset copy from elsewhere in the project).

**Why:** A blank/broken-image screenshot of only the first scene looks fine because Vite doesn't 404 loudly in the screenshot tool, and the workflow logs stay clean (missing static assets don't crash the dev server) — so this class of bug is easy to miss in an existing verification pass.

**How to apply:** After the subagent reports completion, before restarting the workflow, grep the scene files for image `src` references and confirm each referenced path exists under `public/images/`. Generate missing images (generateImage) or copy existing brand assets in as needed, then restart and screenshot to confirm.
