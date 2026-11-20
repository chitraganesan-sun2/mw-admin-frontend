import { useCallback, useRef, useState } from "react";
import { createInFlightGuard } from "@/utils/inflight";

/**
 * `run(fn)` ignores re-entry while a previous `fn` is still running (synchronously, so a fast
 * double-click or a double form submit can't slip through), and `pending` drives the button's
 * disabled/loading state. Errors propagate to the caller; handle them there.
 */
export function useInFlight() {
    const guard = useRef(createInFlightGuard());
    const [pending, setPending] = useState(false);

    const run = useCallback(async <T,>(fn: () => Promise<T> | T): Promise<T | undefined> => {
        if (guard.current.busy) return undefined;
        setPending(true);
        try {
            return await guard.current.run(fn);
        } finally {
            setPending(false);
        }
    }, []);

    return { pending, run };
}
