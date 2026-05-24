/**
 * ============================================
 * COMPONENT STYLING GUIDE
 * ============================================
 * 
 * This guide provides exact CSS for all ChatSphere components
 * following the design system in DESIGN_SYSTEM.md
 */

/**
 * ============================================
 * 1. LAYOUT COMPONENTS
 * ============================================
 */

/* MainLayout: Full-screen app container */
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: var(--wa-bg);
  color: var(--wa-text);
  font-family: var(--font-family);
}

/* Sidebar: 320px fixed on desktop, hidden on mobile */
.sidebar {
  display: none;
  width: var(--size-sidebar);
  height: 100vh;
  background: var(--wa-surface);
  border-right: 1px solid var(--wa-border-strong);
  flex-direction: column;
  z-index: 20;
}

@media (min-width: 1024px) {
  .sidebar {
    display: flex;
  }
}

/* Chat Area: Responsive grid */
.chat-area {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100vh;
  background: var(--wa-bg);
}

/* ============================================
   2. HEADER COMPONENTS
   ============================================ */

.sidebar-header {
  height: var(--size-header);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--wa-border-strong);
  gap: var(--space-sm);
}

.sidebar-header h2 {
  font-size: 18px;
  font-weight: var(--fw-semibold);
  margin: 0;
  flex: 1;
}

.sidebar-header-subtitle {
  font-size: 12px;
  color: var(--wa-text-secondary);
  margin-top: 2px;
}

.chat-header {
  height: var(--size-header);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--wa-border-strong);
  background: var(--wa-surface);
  gap: var(--space-md);
}

.chat-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex: 1;
}

.chat-header-title {
  font-size: 16px;
  font-weight: var(--fw-semibold);
  margin: 0;
}

.chat-header-status {
  font-size: 12px;
  color: var(--wa-text-secondary);
  margin-top: 2px;
}

.chat-header-actions {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

/* ============================================
   3. BUTTON COMPONENTS
   ============================================ */

/* Icon Button: 40px circular with icon */
.icon-button {
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--wa-text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.icon-button:hover {
  background: var(--wa-sidebar-hover);
  transform: scale(1.05);
}

.icon-button:active {
  transform: scale(0.95);
}

/* Call Button: 60px circular */
.call-button {
  width: 60px;
  height: 60px;
  min-width: 60px;
  min-height: 60px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: white;
  transition: all var(--transition-fast);
}

.call-button.primary {
  background: var(--wa-green);
  box-shadow: var(--shadow-md);
}

.call-button.primary:hover {
  background: var(--wa-green-hover);
  transform: scale(1.1);
}

.call-button.danger {
  background: var(--wa-error);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.call-button.danger:hover {
  background: #c82333;
  transform: scale(1.1);
}

/* Send Button: Composer */
.composer-send {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--wa-green);
  color: white;
  border: none;
  cursor: pointer;
  font-size: 18px;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.composer-send:hover:not(:disabled) {
  background: var(--wa-green-hover);
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.composer-send:active:not(:disabled) {
  transform: scale(0.95);
}

.composer-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   4. INPUT COMPONENTS
   ============================================ */

.composer-input {
  flex: 1;
  height: 40px;
  border-radius: var(--radius-full);
  padding: 10px 14px;
  border: 1px solid var(--wa-border-strong);
  background: var(--wa-sidebar-hover);
  color: var(--wa-text);
  font-size: 14px;
  font-family: var(--font-family);
  resize: none;
  outline: none;
  transition: all var(--transition-fast);
}

.composer-input:focus {
  border-color: var(--wa-green);
  background: var(--wa-surface);
  box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.1);
}

.composer-input::placeholder {
  color: var(--wa-text-secondary);
}

/* Search Input */
.search-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-full);
  border: 1px solid var(--wa-border);
  background: var(--wa-sidebar-hover);
  color: var(--wa-text);
  font-size: 14px;
  font-family: var(--font-family);
}

.search-input:focus {
  border-color: var(--wa-green);
  outline: none;
}

/* ============================================
   5. MESSAGE BUBBLE COMPONENTS
   ============================================ */

.message-bubble {
  display: flex;
  gap: var(--space-sm);
  align-items: flex-end;
  margin-bottom: var(--space-md);
}

.message-bubble.sent {
  justify-content: flex-end;
}

.message-bubble.received {
  justify-content: flex-start;
}

.bubble-sent {
  background: var(--wa-sent);
  color: var(--wa-text);
  border-radius: 10px 10px 0 10px;
  box-shadow: var(--shadow-subtle);
  padding: 12px 16px;
  max-width: 70%;
  word-wrap: break-word;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .bubble-sent {
    max-width: 80%;
    padding: 10px 14px;
  }
}

.bubble-received {
  background: var(--wa-received);
  color: var(--wa-text);
  border-radius: 10px 10px 10px 0;
  box-shadow: var(--shadow-subtle);
  border: 1px solid var(--wa-border);
  padding: 12px 16px;
  max-width: 70%;
  word-wrap: break-word;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .bubble-received {
    max-width: 80%;
    padding: 10px 14px;
  }
}

/* Message Timestamp */
.message-timestamp {
  font-size: 11px;
  color: var(--wa-text-secondary);
  opacity: 0.7;
  margin-top: 4px;
  margin-left: auto;
  font-weight: var(--fw-normal);
  white-space: nowrap;
}

/* Read Status */
.read-status {
  font-size: 11px;
  color: var(--wa-text-secondary);
  opacity: 0.7;
  margin-left: 4px;
  font-weight: var(--fw-medium);
}

/* ============================================
   6. CHAT LIST COMPONENTS
   ============================================ */

.chat-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-sm);
}

.chat-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  border-left: 4px solid transparent;
  height: auto;
  min-height: 72px;
}

.chat-item:hover {
  background: var(--wa-sidebar-hover);
}

.chat-item.active {
  background: var(--wa-sidebar-active);
  border-left-color: var(--wa-green);
}

.chat-item-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
}

.chat-item-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-item-name {
  font-size: 15px;
  font-weight: var(--fw-500);
  color: var(--wa-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-item-message {
  font-size: 13px;
  color: var(--wa-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.chat-item-unread {
  background: var(--wa-green);
  color: white;
  border-radius: 12px;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: var(--fw-semibold);
  flex-shrink: 0;
}

/* Online Indicator */
.online-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--wa-online);
  border: 2px solid var(--wa-surface);
  position: absolute;
  bottom: 0;
  right: 0;
}

/* ============================================
   7. COMPOSER COMPONENTS
   ============================================ */

.chat-composer {
  position: sticky;
  bottom: 0;
  z-index: 30;
  height: var(--size-composer);
  display: flex;
  align-items: flex-end;
  gap: var(--space-md);
  padding: 10px var(--space-lg);
  background: var(--wa-surface);
  border-top: 1px solid var(--wa-border-strong);
  transition: all var(--transition-fast);
  will-change: transform;
}

@media (max-width: 768px) {
  .chat-composer {
    height: 56px;
    padding: 8px var(--space-md);
    gap: var(--space-sm);
  }
}

/* ============================================
   8. MODAL & OVERLAY COMPONENTS
   ============================================ */

.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--wa-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  animation: fadeIn var(--transition-standard);
}

.modal-content {
  background: var(--wa-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-2xl);
  max-width: 500px;
  width: 90%;
  box-shadow: var(--shadow-lg);
  animation: scaleIn var(--transition-standard);
}

/* ============================================
   9. DARK MODE OVERRIDES
   ============================================ */

[data-theme="dark"] .bubble-sent {
  background: var(--wa-dark-sent);
  color: var(--wa-dark-text);
  box-shadow: var(--shadow-subtle);
}

[data-theme="dark"] .bubble-received {
  background: var(--wa-dark-received);
  color: var(--wa-dark-text);
  border: 1px solid var(--wa-border);
  box-shadow: var(--shadow-subtle);
}

[data-theme="dark"] .composer-input {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--wa-border);
  color: var(--wa-dark-text);
}

[data-theme="dark"] .composer-input:focus {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--wa-green);
}

/* ============================================
   10. ACCESSIBILITY
   ============================================ */

*:focus-visible {
  outline: 2px solid var(--wa-green);
  outline-offset: 2px;
}

button:active:not(:disabled) {
  transform: scale(0.98);
}

@media (hover: none) {
  .icon-button:hover {
    background: transparent;
    transform: none;
  }
  
  .chat-item:hover {
    background: transparent;
  }
}
