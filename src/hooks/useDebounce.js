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
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
  
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); 

  return debouncedValue;
}