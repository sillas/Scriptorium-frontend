
import { useCallback, useEffect, useRef } from "react";


type SetDebounce = (callback: () => void, delay: number) => void;
type ClearDebounce = () => void;

export function useDebounceTimer(): [SetDebounce, ClearDebounce] {

    const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
   * Clears the active debounce timer if one exists
   * Used to cancel pending auto-save operations
   */
    const clearDebounceTimer = useCallback(() => {
        if (!debounceTimeoutRef.current) return;
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
    }, []);

    const setDebounce = useCallback((callback: () => void, delay: number) => {
        debounceTimeoutRef.current = setTimeout(callback, delay);
    }, []);

    useEffect(() => {
        return () => clearDebounceTimer();
    }, []);

    return [
        setDebounce,
        clearDebounceTimer
    ]
}