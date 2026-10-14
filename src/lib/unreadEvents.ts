// Fired by the chat room once its "mark as read" update has landed, so the nav badge and
// conversation list can re-read their counts right away instead of waiting for Realtime.
export const UNREAD_CHANGED = "unread-changed";
export const notifyUnreadChanged = () => window.dispatchEvent(new Event(UNREAD_CHANGED));
