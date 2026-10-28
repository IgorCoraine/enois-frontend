export interface ChatDockState {
  expanded: boolean;
  openChats: string[];

  toggleExpanded: () => void;
  collapse: () => void;
  expand: () => void;
  openChat: (id: string) => void;
  closeChat: (id: string) => void;
}
