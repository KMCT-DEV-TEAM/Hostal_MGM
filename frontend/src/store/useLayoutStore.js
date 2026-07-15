import { create } from "zustand";

const defaultState = {
    header: {
        variant: "dashboard",
        title: "",
        showBack: false,
    },
    footer: {
        visible: true,
    }
};

export const useLayoutStore = create((set) => ({
    ...defaultState,

    setHeader: (headerConfig) =>
        set((state) => ({ header: { ...state.header, ...headerConfig } })),

    setFooter: (footerConfig) =>
        set((state) => ({ footer: { ...state.footer, ...footerConfig } })),

    resetLayout: () =>
        set(defaultState),
}));