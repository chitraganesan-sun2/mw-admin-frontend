"use client";

import { create } from "zustand";

export const useComponentStore = create<UseComponentStoreProps>()((set, get) => ({
    headerOptions: null,
    setHeaderOptions: (options: HeaderOptions) => set({ headerOptions: options }),
}));
