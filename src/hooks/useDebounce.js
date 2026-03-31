import { useState, useEffect } from "react";

/**
 * A custom hook that returns a debounced value.
 * Useful for delaying API calls until the user stops typing.
 *
 * @param {any} value - The value to debounce (e.g., a search term string).
 * @param {number} delay - The delay in milliseconds.
 * @returns {any} The debounced value.
 */
export default function useDebounce(value, delay) {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Update debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes (also on component unmount)
    // This is how we prevent memory leaks and redundant API calls!
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Only re-call effect if value or delay changes

  return debouncedValue;
}