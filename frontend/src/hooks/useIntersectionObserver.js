import { useEffect, useRef, useState } from 'react';

export const useIntersectionObserver = (callback, options = {}) => {
    const [target, setTarget] = useState(null);
    const callbackRef = useRef(callback);

    // Keep callback fresh without re-running effect
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!target) return;

        const observer = new IntersectionObserver((entries) => {
            const [entry] = entries;
            if (entry.isIntersecting) {
                callbackRef.current();
            }
        }, options);

        observer.observe(target);

        return () => {
            observer.unobserve(target);
        };
    }, [target, options.root, options.rootMargin, options.threshold]);

    return setTarget;
};
