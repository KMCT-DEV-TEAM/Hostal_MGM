import { create } from "zustand";

export const useQRModalStore = create((set) => ({
    isOpen: false,
    openModal: () => set({ isOpen: true }),
    closeModal: () => set({ isOpen: false })
}));
