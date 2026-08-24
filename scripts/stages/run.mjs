// Shared runner for the staged build pipeline (see ARCHITECTURE.md "Build
// pipeline"). Each stage lists its steps explicitly; a step failure aborts the
// pipeline with the stage, the script and the exit code in the error message.
import { spawnSync } from "node:child_process";
import path from "node:path";

const ROOT = process.cwd();

export function runStage(stage, steps, root = ROOT) {
  for (const step of steps) {
    console.log(`\n[build:${stage}] ${step}`);
    const started = Date.now();
    const result = spawnSync(process.execPath, [path.join(root, step)], { stdio: "inherit", cwd: root });
    if (result.error) throw new Error(`build stage "${stage}" could not start ${step}: ${result.error.message}`);
    if (result.status !== 0) {
      const detail = result.status === null ? `signal ${result.signal}` : `exit ${result.status}`;
      throw new Error(`build stage "${stage}" failed at ${step} (${detail})`);
    }
    console.log(`[build:${stage}] ${step} done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  }
}
