// Lightweight event bus for chat unread count updates.
// Dispatch "chat:unread-update" from anywhere to trigger a refetch in BottomNav.

export function notifyChatUpdate() {
  window.dispatchEvent(new Event("chat:unread-update"));
}
