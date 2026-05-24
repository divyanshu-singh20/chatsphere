/**
 * ============================================
 * ANIMATION & INTERACTIONS GUIDE
 * ============================================
 * 
 * Smooth, professional animations following WhatsApp standards
 */

/**
 * ============================================
 * 1. ANIMATION TIMING
 * ============================================
 */

/* Fast: 150ms - quick interactions (hover, focus) */
--transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);

/* Standard: 300ms - default transitions (page changes, modals) */
--transition-standard: 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Slow: 500ms - important transitions (complex animations) */
--transition-slow: 0.5s cubic-bezier(0.4, 0, 0.2, 1);

/* Easing: Material Design standard */
--easing-standard: cubic-bezier(0.4, 0, 0.2, 1);

/* Easing: Spring-like bounce effect */
--easing-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/**
 * ============================================
 * 2. MESSAGE ANIMATIONS
 * ============================================
 */

/* Message entry: slide up + fade in */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-bubble {
  animation: slideInUp var(--transition-standard) ease-out;
}

/* Staggered message group animation */
.message-group > .message-bubble:nth-child(1) {
  animation-delay: 0ms;
}

.message-group > .message-bubble:nth-child(2) {
  animation-delay: 50ms;
}

.message-group > .message-bubble:nth-child(3) {
  animation-delay: 100ms;
}

/* Message hover effect: subtle shadow increase */
.message-bubble {
  transition: box-shadow var(--transition-fast);
}

.message-bubble:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/**
 * ============================================
 * 3. BUTTON ANIMATIONS
 * ============================================
 */

/* Button hover: scale + shadow */
button {
  transition: all var(--transition-fast);
}

button:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Button active: press down effect */
button:active:not(:disabled) {
  transform: scale(0.95);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Send button specific */
.composer-send {
  transition: all var(--transition-fast);
  background: var(--wa-green);
}

.composer-send:hover:not(:disabled) {
  background: var(--wa-green-hover);
  transform: scale(1.05);
}

.composer-send:active:not(:disabled) {
  transform: scale(0.95);
}

/**
 * ============================================
 * 4. LIST ITEM ANIMATIONS
 * ============================================
 */

/* Chat item: background color shift on hover */
.chat-item {
  transition: background-color var(--transition-fast);
}

.chat-item:hover {
  background-color: var(--wa-sidebar-hover);
}

/* Active chat item: left border animation */
.chat-item.active {
  border-left-color: var(--wa-green);
  background-color: var(--wa-sidebar-active);
}

/* Smooth transition when changing active */
.chat-item:not(.active) {
  border-left-color: transparent;
}

/**
 * ============================================
 * 5. TYPING INDICATOR ANIMATION
 * ============================================
 */

@keyframes typingAnimation {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.typing-indicator span {
  animation: typingAnimation 1.4s infinite;
  display: inline-block;
  margin: 0 2px;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

/**
 * ============================================
 * 6. MODAL & POPUP ANIMATIONS
 * ============================================
 */

/* Backdrop: fade in */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-overlay {
  animation: fadeIn var(--transition-standard) ease-out;
}

/* Content: scale in with spring effect */
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-content {
  animation: scaleIn var(--transition-standard) ease-out;
}

/* Popup card: staggered children animation */
.modal-content > * {
  animation: slideInUp var(--transition-standard) ease-out;
}

.modal-content > *:nth-child(1) {
  animation-delay: 0ms;
}

.modal-content > *:nth-child(2) {
  animation-delay: 100ms;
}

.modal-content > *:nth-child(3) {
  animation-delay: 200ms;
}

/**
 * ============================================
 * 7. CALL SCREEN ANIMATIONS
 * ============================================
 */

/* Incoming call popup: pop effect */
.incoming-call-popup {
  animation: scaleIn var(--transition-standard) ease-out;
}

/* Call button: spring effect on hover */
.call-button {
  transition: all var(--transition-fast);
}

.call-button:hover {
  transform: scale(1.1);
  box-shadow: 0 8px 24px rgba(37, 211, 102, 0.3);
}

.call-button:active {
  transform: scale(0.95);
}

/* Avatar pulse animation */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.call-avatar {
  animation: pulse 2s ease-in-out infinite;
}

/* Avatar scale effect */
@keyframes scaleInSpring {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.call-avatar {
  animation: scaleInSpring var(--transition-standard) cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/**
 * ============================================
 * 8. INPUT FOCUS ANIMATIONS
 * ============================================
 */

/* Input border: green focus animation */
.composer-input {
  transition: border-color var(--transition-fast), 
              background-color var(--transition-fast),
              box-shadow var(--transition-fast);
}

.composer-input:focus {
  border-color: var(--wa-green);
  background-color: var(--wa-surface);
  box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.1);
}

/* Search input focus effect */
.search-input:focus {
  border-color: var(--wa-green);
}

/**
 * ============================================
 * 9. SIDEBAR TRANSITIONS
 * ============================================
 */

/* Sidebar sliding animation on mobile */
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-320px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Sidebar open animation (if implemented) */
.sidebar.open {
  animation: slideInLeft var(--transition-standard) ease-out;
}

/**
 * ============================================
 * 10. SCROLL ANIMATIONS
 * ============================================ */

/* Auto-scroll smooth behavior */
.message-list {
  scroll-behavior: smooth;
}

/* Scrollbar styling */
.message-list::-webkit-scrollbar {
  width: 8px;
}

.message-list::-webkit-scrollbar-track {
  background: var(--wa-bg);
}

.message-list::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.message-list::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/**
 * ============================================
 * 11. ACCESSIBILITY - REDUCED MOTION
 * ============================================
 */

/* Respect user preferences for reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/**
 * ============================================
 * 12. FOCUS VISIBLE ANIMATION
 * ============================================
 */

/* Green focus outline on keyboard navigation */
*:focus-visible {
  outline: 2px solid var(--wa-green);
  outline-offset: 2px;
  transition: outline var(--transition-fast);
}

/**
 * ============================================
 * 13. GESTURE ANIMATIONS (Touch)
 * ============================================
 */

/* Long press effect (visual feedback) */
button:active {
  transform: scale(0.95);
}

/* Double tap zoom prevention */
@media (max-width: 768px) {
  input,
  textarea {
    font-size: 16px; /* Prevent iOS auto-zoom */
  }
}

/* Disable hover on touch devices */
@media (hover: none) {
  button:hover {
    transform: none;
  }
  
  .chat-item:hover {
    background: transparent;
  }
}

/* Active states on touch */
@media (hover: none) {
  button:active {
    transform: scale(0.95);
    background: var(--wa-sidebar-hover);
  }
}

/**
 * ============================================
 * 14. TRANSITION UTILITIES
 * ============================================
 */

.transition-fast {
  transition: all var(--transition-fast);
}

.transition-standard {
  transition: all var(--transition-standard);
}

.transition-slow {
  transition: all var(--transition-slow);
}

/* Color-only transitions */
.transition-color {
  transition: color var(--transition-fast),
              background-color var(--transition-fast),
              border-color var(--transition-fast);
}

/* Transform-only transitions */
.transition-transform {
  transition: transform var(--transition-fast),
              box-shadow var(--transition-fast);
}

/**
 * ============================================
 * 15. ANIMATION BEST PRACTICES
 * ============================================
 */

/*
 * ✓ Always use hardware-accelerated properties:
 *   - transform (translate, rotate, scale)
 *   - opacity
 *   - NOT: left, top, width, height (causes reflow)
 * 
 * ✓ Keep animations under 300ms for interactions
 * ✓ Use cubic-bezier(0.4, 0, 0.2, 1) for smooth feel
 * ✓ Stagger animations in lists (50-100ms delay)
 * ✓ Always respect prefers-reduced-motion
 * ✓ Enable will-change for expensive animations
 * ✓ Test on real devices (60fps target)
 */
