/* eslint-disable */

let requireFn: NodeRequire;

export function nodeRequire<T>(moduleName: string) {
    if (!requireFn) {
        requireFn = eval("require");
    }
    return requireFn(moduleName) as T;
}

export const performance =
    typeof globalThis.window !== "undefined"
        ? window.performance
        : nodeRequire<typeof import("perf_hooks")>("perf_hooks").performance;
