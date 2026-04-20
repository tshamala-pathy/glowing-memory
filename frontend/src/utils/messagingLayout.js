/**
 * Layout helpers for client messaging routes (`/messages`, `/messages/:threadId`).
 *
 * Context:
 * - `App.js` wraps the app in a column flex: sticky `Navbar` (h-16) + `<main className="flex-1 min-h-0 flex flex-col">`.
 * - Messaging pages use `flex: 1`, `minHeight: 0`, and `width: 100%` so they fill `<main>` on all viewports.
 * - Safe-area padding uses `env(safe-area-inset-*)` so content clears notches and home indicators when
 *   `viewport-fit=cover` is set (see `public/index.html`).
 *
 * @module messagingLayout
 */

/** Flex child that grows to fill `<main>`; `minHeight: 0` allows nested scroll regions to shrink. */
export const MESSAGING_MAIN_FILL = {
  flex: '1 1 auto',
  width: '100%',
  maxWidth: '100%',
  minHeight: 0,
  boxSizing: 'border-box',
};

/** Horizontal + top safe insets (ThreadChat outer shell; bottom inset applied on inner row). */
export const MESSAGING_SAFE_AREA_TOP_SIDES = {
  paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
  paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
  paddingTop: 'max(0.25rem, env(safe-area-inset-top, 0px))',
};

/** Full safe-area padding for the Messages list page shell. */
export const MESSAGING_SAFE_AREA_FULL = {
  ...MESSAGING_SAFE_AREA_TOP_SIDES,
  paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))',
  paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
};

/** Merged style for `<Messages />` root `style` prop. */
export const MESSAGES_PAGE_STYLE = {
  ...MESSAGING_MAIN_FILL,
  ...MESSAGING_SAFE_AREA_FULL,
};

/**
 * Same object as {@link MESSAGES_PAGE_STYLE}. Use this in `Messages.js` so the style helper is
 * explicitly imported (avoids `no-undef` if the bundler cache references an older function name).
 *
 * @returns {typeof MESSAGES_PAGE_STYLE}
 */
export function getMessagesPageStyle() {
  return MESSAGES_PAGE_STYLE;
}

/** Merged style for `<ThreadChat />` outer shells (loading, error, main). */
export const THREAD_CHAT_SHELL_STYLE = {
  ...MESSAGING_MAIN_FILL,
  ...MESSAGING_SAFE_AREA_TOP_SIDES,
};
