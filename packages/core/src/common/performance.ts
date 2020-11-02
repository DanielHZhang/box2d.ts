/* eslint-disable */

type NodePerfHooks = typeof import("perf_hooks");

export const performance =
    typeof globalThis.window !== "undefined"
        ? window.performance
        : (require("perf_hooks") as NodePerfHooks).performance;
