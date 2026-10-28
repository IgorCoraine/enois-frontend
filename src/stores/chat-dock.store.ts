import type { ChatDockState } from "@/types/stores/chat-dock-state";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const MAX_OPEN_CHATS = 4;

export const useChatDockStore = create<ChatDockState>()(
  persist(
    (set) => ({
      expanded: false,
      openChats: [],

      toggleExpanded: () => set((s) => ({ expanded: !s.expanded })),
      collapse: () => set({ expanded: false }),
      expand: () => set({ expanded: true }),

      openChat: (id: string) =>
        set((s) => {
          if (s.openChats.includes(id)) return s;
          const next = [id, ...s.openChats].slice(0, MAX_OPEN_CHATS);
          return { openChats: next, expanded: false };
        }),

      closeChat: (id: string) => set((s) => ({ openChats: s.openChats.filter((c) => c !== id) })),
    }),
    {
      name: "enois-chat-dock",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ expanded: s.expanded, openChats: s.openChats }),
    },
  ),
);
