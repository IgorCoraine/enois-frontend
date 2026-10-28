import { useQuery } from "@tanstack/react-query";

import { useChatDockStore } from "@/stores/chat-dock.store";
import { texts } from "@/texts";
import { ChevronDown, X } from "lucide-react";

import { messagesApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";

import { ConversationThread } from "@/components/messages/conversation-thread";

/**
 * Mini-janela de conversa flutuante. Reaproveita o ConversationThread inteiro —
 * ele ja foi projetado pra viver fora da rota.
 */
export function ChatDockWindow({ conversationId }: { conversationId: string }) {
  const closeChat = useChatDockStore((s) => s.closeChat);
  const { data: currentUser } = useCurrentUser();

  const {
    data: conversation,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => messagesApi.getConversation(conversationId),
    staleTime: 60_000,
    retry: 1,
  });

  // Conversa apagada, id antigo no localStorage, ou falha de rede: fecha a janela
  // em vez de ficar no skeleton eterno.
  if (isError || (!isLoading && !conversation)) {
    closeChat(conversationId);
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-[28rem] w-80 flex-col overflow-hidden rounded-t-2xl border border-border-soft bg-surface-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
          <span className="h-4 w-24 animate-pulse rounded bg-surface-2" />

          <button
            type="button"
            onClick={() => closeChat(conversationId)}
            className="grid h-7 w-7 place-items-center rounded-full text-text-subtle transition hover:bg-surface-2"
            aria-label={texts.common.close}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <span className="text-xs text-text-subtle">{texts.chatDock.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[28rem] w-80 flex-col overflow-hidden rounded-t-2xl border border-border-soft bg-surface-card shadow-xl">
      <ConversationThread conversation={conversation} currentUserId={currentUser?.id ?? null} />
    </div>
  );
}
