import { useEffect, useRef } from 'react';
import { showErrorToast } from '@/utils/toast';

export const useLoginTimeout = (watch, reset, timeoutMs = 60000) => { // Default to 1 minute
    const timerRef = useRef(null);

    useEffect(() => {
        const checkTimeout = () => {
            const values = watch();
            // Check if user has entered anything (e.g. email or password)
            const hasData = Object.values(values).some(val => typeof val === 'string' && val.trim() !== '' && !['student', 'parent', 'admin', 'warden', 'maintenance_staff'].includes(val));
            
            if (hasData) {
                reset();
                showErrorToast('Session Timeout', 'Login fields cleared due to inactivity for your security.');
            }
        };

        const resetTimer = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(checkTimeout, timeoutMs);
        };

        // Attach listeners to reset timer on activity
        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keypress', resetTimer);
        window.addEventListener('click', resetTimer);
        window.addEventListener('scroll', resetTimer);

        // Start timer initially
        resetTimer();

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keypress', resetTimer);
            window.removeEventListener('click', resetTimer);
            window.removeEventListener('scroll', resetTimer);
        };
    }, [watch, reset, timeoutMs]);
};
