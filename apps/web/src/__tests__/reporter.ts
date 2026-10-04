/**
 * NePay Custom Vitest Reporter
 *
 * Always shows:  X passed | Y failed (Z total)
 * so you can immediately see 0 failed is intentional, not missing.
 */

import type { Reporter, File, TaskResultPack, Vitest } from "vitest";

export default class NepayReporter implements Reporter {
  private ctx!: Vitest;
  private startTime = 0;

  // Vitest calls this when the reporter is initialised
  onInit(ctx: Vitest) {
    this.ctx = ctx;
  }

  onCollected() {
    // nothing — we wait for results
  }

  onTaskUpdate(_packs: TaskResultPack[]) {
    // nothing — we print summary at the end
  }

  onFinished(files: File[] = []) {
    const duration = Date.now() - (this.ctx.state?.startTime ?? Date.now());

    let totalFiles = 0;
    let passedFiles = 0;
    let failedFiles = 0;
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;

    for (const file of files) {
      totalFiles++;

      const fileResult = file.result;
      if (fileResult?.state === "fail") {
        failedFiles++;
      } else if (fileResult?.state === "pass") {
        passedFiles++;
      }

      for (const task of this.collectTasks(file)) {
        if (task.type !== "test") continue;
        totalTests++;

        const state = task.result?.state;
        if (state === "pass") passedTests++;
        else if (state === "fail") failedTests++;
        else if (state === "skip" || state === "todo") skippedTests++;
      }
    }

    const RESET  = "\x1b[0m";
    const BOLD   = "\x1b[1m";
    const GREEN  = "\x1b[32m";
    const RED    = "\x1b[31m";
    const YELLOW = "\x1b[33m";
    const CYAN   = "\x1b[36m";
    const DIM    = "\x1b[2m";

    const ok   = (n: number) => `${BOLD}${GREEN}${n} passed${RESET}`;
    const fail = (n: number) =>
      n > 0
        ? `${BOLD}${RED}${n} failed${RESET}`
        : `${DIM}0 failed${RESET}`;
    const skip = (n: number) =>
      n > 0 ? ` ${YELLOW}${n} skipped${RESET}` : "";

    const fileStatus =
      `  ${CYAN}Test Files${RESET}  ${ok(passedFiles)} | ${fail(failedFiles)}${skip(0)} ${DIM}(${totalFiles} total)${RESET}`;

    const testStatus =
      `  ${CYAN}Tests     ${RESET}  ${ok(passedTests)} | ${fail(failedTests)}${skip(skippedTests)} ${DIM}(${totalTests} total)${RESET}`;

    const ms = duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(2)}s`;
    const timeStatus = `  ${CYAN}Duration  ${RESET}  ${ms}`;

    // Print any failures first so they stand out
    if (failedTests > 0) {
      console.error(`\n${BOLD}${RED}FAILURES:${RESET}`);
      for (const file of files) {
        for (const task of this.collectTasks(file)) {
          if (task.type !== "test" || task.result?.state !== "fail") continue;
          const err = task.result.errors?.[0];
          console.error(
            `\n  ${RED}✗${RESET} ${DIM}${file.name}${RESET} > ${task.name}`
          );
          if (err?.message) {
            console.error(`    ${DIM}${err.message}${RESET}`);
          }
        }
      }
    }

    // Summary block
    console.log(`\n${BOLD} RESULTS ${RESET}`);
    console.log(fileStatus);
    console.log(testStatus);
    console.log(timeStatus);
    console.log();
  }

  // Walk the task tree recursively
  private *collectTasks(file: File): Generator<any> {
    const walk = function* (tasks: any[]): Generator<any> {
      for (const task of tasks) {
        yield task;
        if (task.tasks) yield* walk(task.tasks);
      }
    };
    if (file.tasks) yield* walk(file.tasks);
  }
}
