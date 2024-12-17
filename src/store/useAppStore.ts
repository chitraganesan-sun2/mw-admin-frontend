"use client";
import { create } from "zustand";
import { useGlobalStore } from "./useGlobalStore";
import { useComponentStore } from "./useComponenetStore";
import { createJSONStorage, devtools, persist } from "zustand/middleware";

export const useAppStore = create<UseAppStoreProps>()(
  devtools(
    persist(
      (set, get, api) => {
        return {
          ...useGlobalStore(set, get, api),
        };
      },
      {
        name: "melody-wings-admin-store",
        storage: createJSONStorage(() => localStorage),
      }
    )
  )
);
