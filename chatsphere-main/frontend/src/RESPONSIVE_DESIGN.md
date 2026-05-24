/**
 * ============================================
 * RESPONSIVE DESIGN GUIDE
 * ============================================
 * 
 * Mobile-first design system with Tailwind CSS breakpoints
 */

/**
 * BREAKPOINTS:
 * - sm: 640px (small phones)
 * - md: 768px (tablets, large phones)
 * - lg: 1024px (desktop, large tablets)
 * - xl: 1280px (wide desktop)
 * 
 * APPROACH:
 * - Base styles: mobile (< 768px)
 * - Use lg: prefix for desktop-only styles
 * - Hidden elements: hidden / lg:flex (mobile hidden, desktop visible)
 * - Sidebar: display: none / lg:display: flex
 */

/**
 * ============================================
 * MOBILE (<768px) - BASE STYLES
 * ============================================
 */

/* Full-screen chat */
.chat-container-mobile {
  display: grid;
  grid-template-columns: 1fr;
  height: 100vh;
  width: 100vw;
  gap: 0;
}

/* No sidebar on mobile */
.sidebar {
  display: none;
}

/* Full-width chat area */
.chat-area {
  grid-column: 1;
  overflow: hidden;
}

/* Compact header */
.chat-header {
  height: 56px;
  padding: var(--space-sm) var(--space-md);
}

/* Smaller avatars */
.chat-header .avatar {
  width: 36px;
  height: 36px;
}

/* Compact composer */
.chat-composer {
  height: 56px;
  padding: 8px var(--space-md);
  gap: var(--space-sm);
}

.composer-input {
  height: 36px;
  padding: 8px 12px;
  font-size: 16px; /* Prevent iOS zoom */
}

.composer-send {
  width: 36px;
  height: 36px;
}

/* Mobile message gaps */
.message-list {
  padding: var(--space-sm);
}

.message-bubble {
  margin-bottom: var(--space-sm);
}

/* Smaller chat items */
.chat-item {
  height: 64px;
  padding: var(--space-sm) var(--space-md);
  min-height: auto;
}

.chat-item-avatar {
  width: 40px;
  height: 40px;
}

.chat-item-name {
  font-size: 14px;
}

.chat-item-message {
  font-size: 12px;
}

/* Fixed body to prevent keyboard jump */
@media (max-width: 768px) {
  body {
    position: fixed;
    width: 100%;
    overflow: hidden;
  }
}

/**
 * ============================================
 * TABLET (768px - 1024px)
 * ============================================
 */

@media (min-width: 768px) and (max-width: 1023px) {
  /* Show sidebar on tablet */
  .sidebar {
    display: flex;
    width: 280px;
  }
  
  .chat-container {
    grid-template-columns: 280px 1fr;
  }
  
  /* Adjust spacing for tablet */
  .chat-header {
    height: 60px;
    padding: var(--space-md) var(--space-lg);
  }
  
  .composer-input {
    height: 40px;
    font-size: 14px;
  }
  
  .chat-item {
    height: 68px;
    padding: var(--space-md) var(--space-lg);
  }
  
  /* Message max-width for tablet */
  .bubble-sent,
  .bubble-received {
    max-width: 75%;
  }
}

/**
 * ============================================
 * DESKTOP (>1024px) - TAILWIND lg:
 * ============================================
 */

@media (min-width: 1024px) {
  /* Show sidebar on desktop */
  .sidebar {
    display: flex;
    width: 320px;
  }
  
  .chat-container {
    grid-template-columns: 320px 1fr;
    gap: 0;
  }
  
  /* Full-size header */
  .chat-header {
    height: 60px;
    padding: var(--space-md) var(--space-lg);
  }
  
  /* Full-size composer */
  .chat-composer {
    height: 60px;
    padding: 10px var(--space-lg);
    gap: var(--space-md);
  }
  
  .composer-input {
    height: 40px;
    font-size: 14px;
  }
  
  .composer-send {
    width: 40px;
    height: 40px;
  }
  
  /* Standard chat items */
  .chat-item {
    height: 72px;
    padding: var(--space-sm) var(--space-lg);
  }
  
  .chat-item-avatar {
    width: 48px;
    height: 48px;
  }
  
  .chat-item-name {
    font-size: 15px;
  }
  
  .chat-item-message {
    font-size: 13px;
  }
  
  /* Standard message width */
  .bubble-sent,
  .bubble-received {
    max-width: 70%;
  }
  
  /* Enable hover states */
  .icon-button:hover {
    background: var(--wa-sidebar-hover);
    transform: scale(1.05);
  }
  
  .chat-item:hover {
    background: var(--wa-sidebar-hover);
  }
}

/**
 * ============================================
 * SPECIFIC RESPONSIVE PATTERNS
 * ============================================
 */

/* Hide sidebar on mobile, show on desktop */
.sidebar {
  display: none; /* mobile: hidden */
}

@media (min-width: 1024px) {
  .sidebar {
    display: flex; /* lg:flex */
  }
}

/* Show mobile back button, hide on desktop */
.mobile-back-button {
  display: block; /* mobile: visible */
}

@media (min-width: 1024px) {
  .mobile-back-button {
    display: none; /* lg:hidden */
  }
}

/* Responsive avatar sizes */
.avatar {
  width: 36px; /* mobile */
  height: 36px;
}

@media (min-width: 768px) {
  .avatar {
    width: 40px; /* tablet */
    height: 40px;
  }
}

@media (min-width: 1024px) {
  .avatar {
    width: 48px; /* desktop */
    height: 48px;
  }
}

/* Responsive font sizes */
.chat-name {
  font-size: 14px; /* mobile */
}

@media (min-width: 768px) {
  .chat-name {
    font-size: 15px; /* tablet */
  }
}

/* Responsive container padding */
.message-list {
  padding: var(--space-sm); /* mobile: 8px */
}

@media (min-width: 768px) {
  .message-list {
    padding: var(--space-md); /* tablet: 12px */
  }
}

@media (min-width: 1024px) {
  .message-list {
    padding: var(--space-lg); /* desktop: 16px */
  }
}

/* Responsive button sizes */
.header-button {
  width: 36px; /* mobile */
  height: 36px;
}

@media (min-width: 1024px) {
  .header-button {
    width: 40px; /* desktop */
    height: 40px;
  }
}

/**
 * ============================================
 * TOUCH OPTIMIZATION
 * ============================================
 */

/* Minimum touch target size */
button,
input,
textarea,
select,
a[role="button"] {
  min-height: 44px;
  min-width: 44px;
}

/* Disable hover on touch devices */
@media (hover: none) {
  button:hover {
    background: transparent;
    transform: none;
  }
  
  .chat-item:hover {
    background: transparent;
  }
}

/* Active states on touch */
button:active {
  transform: scale(0.95);
}

/* Prevent tap highlight color on iOS */
a,
button {
  -webkit-tap-highlight-color: rgba(37, 211, 102, 0.1);
}

/**
 * ============================================
 * KEYBOARD OPTIMIZATION
 * ============================================
 */

/* Prevent layout shift on mobile keyboard */
@media (max-width: 768px) {
  body {
    position: fixed;
    width: 100%;
    overflow: hidden;
  }
  
  /* Use flex for viewport management */
  .chat-area {
    display: flex;
    flex-direction: column;
    height: 100dvh; /* dynamic viewport height */
  }
}

/* Composer should stay above keyboard */
.chat-composer {
  position: sticky;
  bottom: 0;
  padding-bottom: env(safe-area-inset-bottom);
}

/**
 * ============================================
 * UTILITY CLASSES
 * ============================================
 */

/* Mobile-only (hide on desktop) */
.mobile-only {
  display: block;
}

@media (min-width: 1024px) {
  .mobile-only {
    display: none;
  }
}

/* Desktop-only (hide on mobile) */
.desktop-only {
  display: none;
}

@media (min-width: 1024px) {
  .desktop-only {
    display: flex;
  }
}

/* Responsive spacing */
.space-responsive {
  padding: var(--space-sm); /* mobile */
}

@media (min-width: 768px) {
  .space-responsive {
    padding: var(--space-md);
  }
}

@media (min-width: 1024px) {
  .space-responsive {
    padding: var(--space-lg);
  }
}

/* Responsive text */
.text-responsive {
  font-size: 14px; /* mobile */
  line-height: 1.4;
}

@media (min-width: 768px) {
  .text-responsive {
    font-size: 15px;
    line-height: 1.5;
  }
}

@media (min-width: 1024px) {
  .text-responsive {
    font-size: 16px;
  }
}
