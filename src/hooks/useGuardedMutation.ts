import { useCallback, useRef } from "react";
import { useMutation, type UseMutationOptions, type UseMutationResult } from "@tanstack/react-query";

/**
 * `useMutation`, but `mutate()` is ignored while the previous call is still running. The check is a
 * ref, so it holds even for two clicks (or two antd form submits, whose validation is async) that
 * land before React re-renders `isPending`. Everything else is exactly useMutation.
 */
export function useGuardedMutation<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
    options: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
    const busy = useRef(false);
    const mutation = useMutation<TData, TError, TVariables, TContext>({
        ...options,
        onSettled: (...args) => {
            busy.current = false;
            return options.onSettled?.(...args);
        },
    });
    const { mutate: rawMutate } = mutation;
    const mutate = useCallback<typeof rawMutate>(
        (variables, mutateOptions) => {
            if (busy.current) return;
            busy.current = true;
            rawMutate(variables, mutateOptions);
        },
        [rawMutate]
    );
    return { ...mutation, mutate };
}
