import { useEffect, useState } from "react";

export function useMediaQuery(query) {
    const getMatches = () => window.matchMedia(query).matches;

    const [matches, setMatches] = useState(getMatches);

    useEffect(() => {
        const mediaQuery = window.matchMedia(query);

        const handler = (event) => {
            setMatches(event.matches);
        };

        mediaQuery.addEventListener("change", handler);

        return () => {
            mediaQuery.removeEventListener("change", handler);
        };
    }, [query]);

    return matches;
}