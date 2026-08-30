import * as React from "react";

export function useMediaQuery(query: string): boolean | null {
    const [matches, setMatches] = React.useState<boolean | null>(null);

    React.useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        window.addEventListener("resize", listener);
        return () => window.removeEventListener("resize", listener);
    }, [matches, query]);

    return matches;
}
