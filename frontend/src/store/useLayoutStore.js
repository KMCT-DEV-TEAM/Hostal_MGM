import { create } from "zustand";

export const useLayoutStore = create((set) => ({
    showHeader: true,
    showFooter: true,

    setShowHeader: (value) =>
        set({ showHeader: value }),

    setShowFooter: (value) =>
        set({ showFooter: value }),

    resetLayout: () =>
        set({
            showHeader: true,
            showFooter: true,
        }),
}));