Frontend rearchitecture overview — WhatsApp-style scalable architecture

Purpose
- Provide a scalable, maintainable, production-grade frontend structure for ChatSphere.
- Preserve existing functionality; introduce incremental, non-breaking scaffolding and patterns.

Recommended folder structure (top-level `src/`)

- components/
  - common/        → Button, IconButton, Avatar (barrels)
  - chat/          → ChatListItem, MessageBubble, MessageInput, TypingIndicator, MessageList
  - call/          → IncomingCallModal, CallControls, VideoContainer, CallTimer
  - sidebar/       → ChatSidebar, ContactList
- layouts/
  - MainLayout.jsx
  - AuthLayout.jsx
- pages/
  - ChatPage.jsx
  - LoginPage.jsx
  - ProfilePage.jsx
- features/
  - auth/          → auth hooks, slices (if using RTK)
  - chats/         → chat-related logic
  - calls/         → call-related logic
- hooks/           → reusable hooks (useSocket, useMedia, useDebounce)
- services/        → apiClient.js, socketClient.js, webrtc helpers
- store/           → global store scaffolding / RTK slices or context provider
- styles/          → design-system CSS, variables, tailwind extensions
- utils/           → helpers, formatters, validators
- assets/          → images, icons, svgs

Guiding Principles
- Components small and focused; avoid monoliths
- Data via central store or context; UI receives data via props
- Services layer abstracts network and socket implementations
- Keep business logic out of presentation components
- Prefer composition over prop-drilling

State Management Recommendation
- For long-term scalability: Redux Toolkit (RTK) with slices per domain (auth/chat/call/theme)
- Lightweight alternative: Zustand for smaller apps and simpler API
- Interim approach: keep current Context API (AuthContext, ChatContext) and gradually migrate to RTK by creating adapter slices

Socket Architecture
- Single socket instance (singleton) managed by `services/socketClient.js`
- `hooks/useSocket.js` to subscribe to events, auto-cleanup
- Centralized event registry to avoid duplicate listeners
- Reconnect/backoff and forensic logging

API Layer
- `services/apiClient.js` provides an Axios instance with interceptors:
  - Attach auth token
  - Refresh token flow
  - Centralized error handling
  - Retry for transient failures

Responsive Layout Strategy
- Mobile-first
- Breakpoints: mobile <768px, tablet 768-1024px, desktop >=1024px
- Sidebar hidden on mobile; full chat view when a conversation is selected
- Desktop: fixed 320px sidebar, centered content area

Performance
- Memoize components (`React.memo`) and heavy lists
- Virtualize long message lists (react-window or react-virtuoso)
- Code-splitting (React.lazy + Suspense) for pages and large components
- Debounce inputs (search, typing) and batch socket emits

Call System
- Dedicated `call` feature folder with peer connection manager
- Call state in central store; thin UI controllers subscribe to state
- Encapsulate WebRTC lifecycle and reconnection logic

Migration Plan (incremental)
1. Add `services/apiClient.js` and `services/socketClient.js` (non-breaking)
2. Add `store/StoreProvider.jsx` as shared context adapter
3. Add `components/common/*` reusable components and barrels
4. Replace presentational components with common components gradually
5. Introduce RTK slices behind adapter hooks (useAuth, useChat) and migrate contexts
6. Add virtualization for MessageList
7. Polish styling (design system already added in `index.css`)

Files created in this pass
- services/apiClient.js (starter)
- services/socketClient.js (starter)
- store/StoreProvider.jsx (context + reducer scaffold)
- components/common/Button.jsx
- components/common/IconButton.jsx
- components/common/index.js
- ARCHITECTURE.md (this file)

Next actions
- Wire `apiClient` into existing service usage (search/replace simple imports)
- Introduce `useSocket` hook and migrate a couple of listeners
- Create `components/chat/ChatListItem.jsx` and `components/chat/MessageInput.jsx` using the new common components
- Add performance optimizations (virtualized message list)

If you want, I can start wiring `apiClient` into `frontend/src/services/api.js` and add `useSocket` next. Which should I do first?