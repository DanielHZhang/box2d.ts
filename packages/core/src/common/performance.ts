/* eslint-disable */

export function nodeRequire<T = any>(moduleName: string) {
    return eval("require")(moduleName) as T;
}

export const performance =
    typeof globalThis.window !== "undefined"
        ? window.performance
        : nodeRequire<typeof import("perf_hooks")>("perf_hooks").performance;
