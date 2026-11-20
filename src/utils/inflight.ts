// Double-click protection for anything that changes data.
//
// React state (`loading`, `isPending`) only updates after a render, and antd's form validation is
// asynchronous, so two quick clicks used to both reach the API (two staff accounts, two approval
// emails). These helpers are synchronous: the second call is refused before anything renders.

export interface InFlightGuard {
    readonly busy: boolean;
    /** Runs `fn` unless one is already running; resolves to undefined when it was refused. */
    run<T>(fn: () => Promise<T> | T): Promise<T | undefined>;
}

export function createInFlightGuard(): InFlightGuard {
    let busy = false;
    return {
        get busy() {
            return busy;
        },
        async run<T>(fn: () => Promise<T> | T) {
            if (busy) return undefined;
            busy = true;
            try {
                return await fn();
            } finally {
                busy = false;
            }
        },
    };
}

// --- request coalescing (safety net in api-client for every state-changing call) -----------------

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * A key that is identical for two identical state-changing requests, or null when the request
 * should never be coalesced (reads, uploads whose body can't be compared).
 */
export function mutationKey(config: { method?: string; url?: string; data?: unknown; params?: unknown }): string | null {
    const method = (config.method ?? "GET").toUpperCase();
    if (SAFE_METHODS.has(method)) return null;
    if (typeof FormData !== "undefined" && config.data instanceof FormData) return null;
    let body = "";
    try {
        body = config.data === undefined ? "" : typeof config.data === "string" ? config.data : JSON.stringify(config.data);
        if (config.params !== undefined) body += `?${JSON.stringify(config.params)}`;
    } catch {
        return null;
    }
    return `${method} ${config.url ?? ""} ${body}`;
}

/** Wraps `send` so an identical in-flight state-changing request shares one network call. */
export function coalesceMutations<C extends { method?: string; url?: string; data?: unknown; params?: unknown }, R>(
    send: (config: C) => Promise<R>
): (config: C) => Promise<R> {
    const inFlight = new Map<string, Promise<R>>();
    return (config) => {
        const key = mutationKey(config);
        if (key === null) return send(config);
        const existing = inFlight.get(key);
        if (existing) return existing;
        const promise = send(config).finally(() => inFlight.delete(key));
        inFlight.set(key, promise);
        return promise;
    };
}
