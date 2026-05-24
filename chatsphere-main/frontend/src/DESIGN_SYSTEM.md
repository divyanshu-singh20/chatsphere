/**
 * ============================================
 * CHATSPHERE DESIGN SYSTEM
 * Production-Grade WhatsApp-like Messaging App
 * ============================================
 */

/* 
 * ============================================
 * 1. COLOR SYSTEM
 * ============================================
 * 
 * PRIMARY: WhatsApp Green
 * - Primary action: #25D366
 * - Hover state: #20ba5c
 * - Disabled: opacity 0.5
 * 
 * LIGHT MODE:
 * - Background: #f0f2f5 (light off-white)
 * - Surface: #ffffff (pure white)
 * - Text Primary: #111b21 (dark text)
 * - Text Secondary: #667781 (muted gray)
 * - Sent Bubble: #d9fdd3 (light green)
 * - Received Bubble: #ffffff (white)
 * - Border: rgba(0,0,0,0.04) (subtle)
 * - Sidebar Active: #e7f3ff (light blue highlight)
 * - Online Status: #31a24c (darker green)
 * - Unread Badge: #25D366 (primary green)
 * 
 * DARK MODE:
 * - Background: #0a0e13 (almost black)
 * - Surface Secondary: #111b21 (dark gray)
 * - Text Primary: #e9edef (off-white)
 * - Text Secondary: #8a8d91 (light gray)
 * - Sent Bubble: #005c4b (dark teal)
 * - Received Bubble: #1f2c33 (dark blue-gray)
 * 
 * SHADOWS:
 * - Subtle: 0 1px 0 rgba(0,0,0,0.04)
 * - Medium: 0 4px 12px rgba(0,0,0,0.1)
 * - Large: 0 20px 60px rgba(0,0,0,0.15)
 * 
 * STATUS COLORS:
 * - Online: #25D366 (green)
 * - Away: #ffb500 (amber)
 * - Offline: #a3b4b6 (gray)
 * - Error: #dc3545 (red)
 * - Info: #0099cc (blue)
 */

/* 
 * ============================================
 * 2. TYPOGRAPHY SYSTEM
 * ============================================
 * 
 * FONT FAMILY:
 * - Primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif
 * - Monospace: 'Monaco', 'Courier New', monospace
 * 
 * SCALE (px):
 * - H1: 32px / font-weight: 600 / line-height: 1.2
 * - H2: 24px / font-weight: 600 / line-height: 1.3
 * - H3: 20px / font-weight: 600 / line-height: 1.4
 * - Large: 18px / font-weight: 500 / line-height: 1.5
 * - Base: 16px / font-weight: 400 / line-height: 1.5
 * - Small: 14px / font-weight: 400 / line-height: 1.5
 * - XSmall: 12px / font-weight: 400 / line-height: 1.4
 * - Tiny: 11px / font-weight: 500 / line-height: 1.3
 * 
 * USAGE:
 * - Chat name in sidebar: 15px / 500
 * - Message text: 14px / 400
 * - Timestamp: 11px / 400
 * - Last message preview: 13px / 400 / muted
 * - Header title: 16px / 600
 * - Online status: 12px / 400 / muted
 * - Button text: 14px / 500
 * - Input placeholder: 14px / 400
 * 
 * MOBILE SCALING:
 * - Reduce by 1-2px on screens < 768px
 * - Maintain line-height proportions
 * - Increase letter-spacing slightly: -0.02em
 */

/* 
 * ============================================
 * 3. SPACING SYSTEM
 * ============================================
 * 
 * BASE UNIT: 4px
 * 
 * SCALE:
 * - xs: 4px (1 unit)
 * - sm: 8px (2 units)
 * - md: 12px (3 units)
 * - lg: 16px (4 units)
 * - xl: 20px (5 units)
 * - 2xl: 24px (6 units)
 * - 3xl: 32px (8 units)
 * - 4xl: 40px (10 units)
 * 
 * COMPONENT SPACING:
 * 
 * Message Bubble:
 * - Padding: 12px horizontal, 8px vertical (md / sm)
 * - Gap between bubbles: 4px
 * - Gap between message group and next: 12px
 * 
 * Chat Item:
 * - Height: 72px (with padding: 8px vertical, 12px horizontal)
 * - Avatar size: 48px
 * - Gap between avatar and text: 12px
 * 
 * Sidebar:
 * - Width: 320px (fixed on desktop)
 * - Header height: 60px
 * - Item padding: 12px 16px
 * 
 * Chat Header:
 * - Height: 60px
 * - Padding: 12px 16px
 * - Button spacing: 8px gap
 * 
 * Composer:
 * - Height: 60px (desktop) / 56px (mobile)
 * - Padding: 10px 16px
 * - Input height: 40px (desktop) / 36px (mobile)
 * - Button size: 40px
 * - Gap: 8px
 * 
 * Button/Icon Spacing:
 * - Icon inside button padding: 8px
 * - Button border-radius: 9999px (fully rounded for circular)
 * - Button gap: 8px
 */

/* 
 * ============================================
 * 4. ICON SYSTEM
 * ============================================
 * 
 * ICON SIZES (width x height):
 * - xs: 16px (timestamps, small badges)
 * - sm: 20px (sidebar icons, subtitles)
 * - md: 24px (standard buttons, mobile nav)
 * - lg: 36px (header buttons, chat controls)
 * - xl: 48px (sidebar avatars)
 * - 2xl: 64px (incoming call popup)
 * - 3xl: 80px (call screen avatar)
 * - full: 112px (video call PiP)
 * 
 * BUTTON SIZES (min):
 * - Mobile touch target: 44px x 44px
 * - Header buttons: 40px x 40px (circular)
 * - Call buttons: 60px x 60px (circular)
 * - Composer buttons: 40px x 40px (circular)
 * - Composer send: 40px x 40px with green background
 * 
 * CIRCULAR BUTTON FORMULA:
 * - Button: width x height equal, border-radius: 9999px
 * - Icon inside: (button_size - 16px) / 2 = icon_size
 *   Example: 40px button = 24px icon (centered with flex)
 * 
 * SPACING AROUND ICONS:
 * - In button: center with flexbox (align-items: center, justify-content: center)
 * - In text: margin-right: 8px
 * - In header: gap: 8px between icons
 */

/* 
 * ============================================
 * 5. RESPONSIVE BREAKPOINTS
 * ============================================
 * 
 * MOBILE (< 768px):
 * Layout:
 * - Full-screen chat view (100vw × 100vh)
 * - No visible sidebar (hidden with lg:hidden)
 * - Single column layout
 * 
 * Components:
 * - Header height: 56px
 * - Composer height: 56px
 * - Chat item height: 64px
 * - Avatar size: 40px (smaller than desktop)
 * 
 * Spacing:
 * - Container padding: 8px (reduced from 12px)
 * - Message gap: 4px (reduced from 8px)
 * - Button margin: 8px
 * 
 * Text:
 * - Reduce by 1-2px
 * - Chat name: 14px
 * - Message: 14px (stays same)
 * - Timestamp: 11px
 * 
 * Composer:
 * - Input height: 36px
 * - Font-size: 16px (prevent iOS zoom)
 * - Padding: 8px 12px
 * 
 * Touch:
 * - All buttons: minimum 44px
 * - Hover states disabled on touch (use @media (hover: hover))
 * - Active states emphasized
 * 
 * Keyboard:
 * - Fixed body position to prevent layout shift
 * - Composer sticky bottom
 * - Use viewport units carefully (vw can overflow)
 * 
 * TABLET (768px - 1024px):
 * - Sidebar visible but narrower: 280px
 * - Message width: 80% max
 * - Adaptive spacing: 12px
 * - Chat items slightly compact: 64px height
 * 
 * DESKTOP (> 1024px):
 * - Full WhatsApp Web layout
 * - Sidebar: 320px fixed width (lg:grid-cols-[320px_1fr])
 * - Message width: 70% max
 * - Full spacing: 16px padding
 * - Hover states fully enabled
 * 
 * KEY UTILITIES:
 * - lg:hidden (hide on desktop)
 * - lg:flex (show only on desktop)
 * - flex (mobile) or hidden (mobile), lg:flex (desktop)
 */

/* 
 * ============================================
 * 6. MESSAGE BUBBLE SYSTEM
 * ============================================
 * 
 * SENT BUBBLE:
 * - Background: #d9fdd3 (light green)
 * - Text color: #111b21
 * - Border-radius: 10px 10px 0 10px (pointy bottom-right)
 * - Padding: 12px 16px (md horizontal, md vertical)
 * - Max-width: 70% desktop, 80% mobile
 * - Alignment: flex-end (right aligned)
 * - Shadow: 0 1px 0 rgba(0,0,0,0.04)
 * 
 * RECEIVED BUBBLE:
 * - Background: #ffffff
 * - Text color: #111b21
 * - Border-radius: 10px 10px 10px 0 (pointy bottom-left)
 * - Padding: 12px 16px
 * - Max-width: 70% desktop, 80% mobile
 * - Alignment: flex-start (left aligned)
 * - Border: 1px solid rgba(0,0,0,0.04)
 * - Shadow: 0 1px 0 rgba(0,0,0,0.04)
 * 
 * MESSAGE GROUP:
 * - Gap between messages from same sender: 4px
 * - Gap between different senders: 12px
 * - Avatar shown only on first message of group
 * - Hide avatar on subsequent messages (save space)
 * 
 * TIMESTAMP PLACEMENT:
 * - Position: inside bubble, bottom-right
 * - Size: 11px
 * - Color: muted (inherit opacity)
 * - Format: 2:34 PM (12-hour with AM/PM)
 * - Read status: "✓" (sent), "✓✓" (seen)
 * 
 * EMOJI SIZING:
 * - Inline emoji: inherit text size (14px)
 * - Emoji-only message: larger (28px)
 * 
 * MEDIA MESSAGE:
 * - Max-width: 100% of bubble max-width
 * - Max-height: 320px (prevent huge images)
 * - Border-radius: match bubble (10px pointy corner)
 * - Caption below media
 * - File attachment: icon + filename
 * 
 * REPLY REFERENCE:
 * - Border-left: 2px solid current-text-color
 * - Opacity: 70%
 * - Font-size: 12px
 * - Padding-left: 12px
 * - Max-width: 90%
 * - Truncate text: truncate class
 * 
 * ANIMATIONS:
 * - Entry: slideInUp + fadeIn (300ms)
 * - Hover: subtle shadow increase
 */

/* 
 * ============================================
 * 7. CALL SCREEN DESIGN
 * ============================================
 * 
 * INCOMING CALL POPUP:
 * Layout:
 * - Position: fixed inset-0 (full screen)
 * - Overlay: semi-transparent dark background
 * - Content: centered card, max-width: 500px
 * - Z-index: 50 (above all)
 * 
 * Components:
 * - Header: "Incoming call" / "Video" indicator
 * - Avatar: 80px circular with pulse animation
 * - Caller name: 32px bold text
 * - Description: helpful text about auto-expiry
 * - Buttons: 2 buttons (decline left, accept right)
 * 
 * Button Styling:
 * - Decline (left): 60px circular, red (#dc3545)
 * - Accept (right): 60px circular, green (#25D366)
 * - Icon: 24px centered
 * - Hover: scale 1.1, shadow effect
 * - Animation: spring-like pop effect
 * 
 * OUTGOING CALL POPUP:
 * - Same layout as incoming
 * - Single cancel button (red)
 * - "Ringing..." text with animation
 * - Avatar pulse: continuous animation
 * 
 * ACTIVE CALL SCREEN:
 * Layout:
 * - Position: fixed full-screen (100dvh)
 * - Remote video: fills entire screen (cover object-fit)
 * - Local video: PiP (Picture-in-Picture)
 * 
 * Local Video PiP:
 * - Size: 112x160px
 * - Position: bottom-right corner, 16px from edges
 * - Border-radius: 12px
 * - Border: 3px solid white
 * - Z-index: 40 (above video)
 * - Can be dragged to move
 * 
 * Call Controls:
 * - Position: bottom center
 * - Layout: horizontal flex, center aligned
 * - Buttons: 60px circular
 * - Mute: gray toggle
 * - Camera: gray toggle
 * - End call: red (dc3545)
 * - Icons: 28px white
 * - Gap: 20px between buttons
 * - Background: semi-transparent (rgba(0,0,0,0.3))
 * - Padding: 20px
 * 
 * Call Timer:
 * - Position: top-center
 * - Format: 00:45:30 (hours:minutes:seconds)
 * - Size: 18px
 * - Color: white
 * - Background: transparent (relies on video contrast)
 * 
 * CONNECTION STATUS:
 * - Position: top-left or top-center
 * - States: "Connecting...", "Connected", "Poor connection"
 * - Color: status-dependent
 * - Size: 12px
 * 
 * ANIMATIONS:
 * - Popup entry: scale (0.8 → 1) + fade
 * - Button hover: scale 1.1
 * - Button tap: scale 0.95
 * - Pulse animation on avatar: continuous opacity change
 * - Staggered entry of popup elements: 100ms delay between items
 */

/* 
 * ============================================
 * 8. ANIMATION SYSTEM
 * ============================================
 * 
 * DURATIONS:
 * - Fast: 150ms (quick interactions)
 * - Standard: 300ms (page transitions)
 * - Slow: 500ms (modals, important transitions)
 * 
 * EASING:
 * - Standard: cubic-bezier(0.4, 0, 0.2, 1) (material design)
 * - Ease-out: cubic-bezier(0, 0, 0.2, 1) (for exits)
 * - Spring: cubic-bezier(0.68, -0.55, 0.265, 1.55) (bounce effect)
 * 
 * KEYFRAME ANIMATIONS:
 * - fadeIn: opacity 0 → 1 (300ms)
 * - slideInUp: translateY(16px) + opacity (300ms)
 * - slideInDown: translateY(-16px) + opacity (300ms)
 * - slideInLeft: translateX(-16px) + opacity (300ms)
 * - slideInRight: translateX(16px) + opacity (300ms)
 * - scaleIn: scale(0.95) + opacity (300ms)
 * - pulse: opacity 1 → 0.5 → 1 (2s infinite)
 * - bounce: translateY(0) → -8px → 0 (varies)
 * - typingAnimation: dots bounce up/down (1.4s infinite)
 * 
 * COMPONENT ANIMATIONS:
 * 
 * Messages:
 * - Entry: slideInUp + fadeIn (300ms)
 * - Group by date: staggered (50ms delay each)
 * 
 * Call Popups:
 * - Entry: scale (300ms spring)
 * - Staggered children: 100ms delay
 * - Avatar: scale spring effect (500ms)
 * 
 * Buttons:
 * - Hover: scale 1.05 (150ms)
 * - Tap: scale 0.95 (immediate)
 * - Hover + shadow: shadow increase (150ms)
 * 
 * Sidebar:
 * - Active item: border-left glow (150ms)
 * - Hover: background color shift (150ms)
 * 
 * Typing Indicator:
 * - Dots: bounce animation (1.4s)
 * - Stagger: 0s, 0.2s, 0.4s delay
 * 
 * Modal/Overlay:
 * - Backdrop: fadeIn (200ms)
 * - Content: scaleIn (300ms, delayed 100ms)
 * - Exit: both reverse simultaneously
 * 
 * ACCESSIBILITY:
 * - Respect @media (prefers-reduced-motion: reduce)
 * - Set animation-duration: 0.01ms when enabled
 * - Disable transitions completely (not hidden)
 */

/* 
 * ============================================
 * 9. DARK MODE SYSTEM
 * ============================================
 * 
 * TRIGGER:
 * - Use [data-theme="dark"] attribute on root element
 * - Alternative: @media (prefers-color-scheme: dark) for OS preference
 * - JavaScript: document.documentElement.setAttribute('data-theme', 'dark')
 * 
 * COLOR OVERRIDES:
 * [data-theme="dark"] {
 *   --wa-bg: #0a0e13;
 *   --wa-text: #e9edef;
 *   --wa-muted: #8a8d91;
 * }
 * 
 * COMPONENT STYLING:
 * 
 * Chat Background:
 * - Light: #f0f2f5
 * - Dark: #0a0e13
 * 
 * Sidebar:
 * - Light: #ffffff
 * - Dark: #111b21
 * 
 * Message Bubbles:
 * - Sent Light: #d9fdd3 (light green)
 * - Sent Dark: #005c4b (dark teal)
 * - Received Light: #ffffff
 * - Received Dark: #1f2c33 (dark slate)
 * 
 * Composer:
 * - Background Light: #ffffff
 * - Background Dark: #111b21
 * - Input Light: #f0f2f5
 * - Input Dark: rgba(255,255,255,0.05)
 * - Border Light: #e5e5e5
 * - Border Dark: rgba(255,255,255,0.1)
 * 
 * Buttons:
 * - Primary (green): stays same (#25D366)
 * - Hover states: adjust brightness slightly
 * - Secondary buttons: light gray (light) / dark gray (dark)
 * 
 * Text Contrast:
 * - Primary text dark mode: #e9edef (very light, contrast > 7:1)
 * - Secondary text dark mode: #8a8d91 (medium gray, contrast > 4.5:1)
 * - All text must meet WCAG AA standards
 * 
 * Shadows:
 * - Light mode: black with opacity
 * - Dark mode: black with less opacity (appears lighter)
 * - Border replacements: subtle 1px borders in dark mode
 * 
 * TRANSITIONS:
 * - Theme change: smooth 300ms color transition
 * - No layout shift
 * - Preserve scroll position
 * - Animate all color properties
 */

/* 
 * ============================================
 * 10. COMPONENT CONSISTENCY
 * ============================================
 * 
 * BORDER RADIUS:
 * - Inputs: 9999px (fully rounded)
 * - Buttons: 9999px (fully rounded for circular)
 * - Cards: 12px (subtle rounding)
 * - Message bubbles: 10px (with one pointed corner)
 * - Images: 12px (in message bubbles, media)
 * - Modals: 16px (larger radius for emphasis)
 * - Avatars: 50% (perfectly circular)
 * 
 * SHADOWS:
 * - Subtle: 0 1px 0 rgba(0,0,0,0.04)
 * - Medium: 0 4px 12px rgba(0,0,0,0.1)
 * - Large: 0 20px 60px rgba(0,0,0,0.15)
 * - Button hover: medium shadow
 * - Modal: large shadow
 * - No shadow on message bubbles (keep clean)
 * 
 * PADDING CONSISTENCY:
 * - Small: 8px
 * - Medium: 12px
 * - Large: 16px
 * - Header/Footer: 16px
 * - Cards: 12px
 * - Buttons: text padding varies by size, icon padding 8px
 * 
 * INPUT HEIGHTS:
 * - Standard: 40px desktop, 36px mobile
 * - Padding: 10px 14px
 * - Border: 1px
 * - Font-size: 14px (16px on mobile to prevent zoom)
 * 
 * BUTTON HEIGHTS:
 * - Minimum: 44px (touch target)
 * - Standard: 40px (header buttons, composer)
 * - Large: 60px (call controls)
 * - Text button padding: 8px 16px
 * 
 * INTERACTION FEEDBACK:
 * - Hover: scale 1.05 + shadow increase (150ms)
 * - Active: scale 0.95 (immediate)
 * - Focus: green outline 2px with 2px offset
 * - Disabled: opacity 0.5 + cursor: not-allowed
 * 
 * TEXT HIERARCHY:
 * - Always use consistent font weights (400 normal, 500 medium, 600 semibold)
 * - Title: 16px / 600
 * - Body: 14px / 400
 * - Caption: 12px / 400
 * - Label: 14px / 500
 * 
 * ICON CONSISTENCY:
 * - All same icon set (react-icons/fi = Feather)
 * - Sizing: use standard sizes (20px, 24px, 36px)
 * - Stroke-width: inherit from library (2px for Feather)
 * - Alignment: center in container
 * - No scaling except on hover/active
 * 
 * ANIMATION CONSISTENCY:
 * - All transitions use standard easing
 * - Message animations: 300ms slideInUp
 * - Button interactions: 150ms ease
 * - Page transitions: 300ms fade
 * - Modal entry: 300ms scaleIn (delayed 100ms)
 * 
 * ACCESSIBILITY:
 * - Min touch target: 44x44px
 * - Color contrast: WCAG AA (4.5:1 minimum)
 * - Focus visible: always visible with outline
 * - Reduced motion: respected always
 * - Semantic HTML: used for all interactions
 */

/* 
 * ============================================
 * IMPLEMENTATION CHECKLIST
 * ============================================
 * 
 * ✓ Color variables in :root
 * ✓ Dark mode variables with [data-theme="dark"]
 * ✓ Typography scale applied to all text elements
 * ✓ Spacing using 4px base unit throughout
 * ✓ Icon sizes standardized (16, 20, 24, 36, 48, 60, 80px)
 * ✓ Button sizes: 40px min, 44px touch target, 60px call
 * ✓ Responsive breakpoints: lg: 1024px
 * ✓ Mobile first: base styles mobile, lg: overrides for desktop
 * ✓ Message bubbles: sent/received with correct colors & radius
 * ✓ Message grouping: same sender gap 4px, different sender 12px
 * ✓ Timestamp inside bubbles: 11px, right-aligned, muted color
 * ✓ Call screens: popup animations, staggered children, button sizes
 * ✓ Animations: fadeIn, slideIn*, scaleIn with standard durations
 * ✓ Composer: sticky bottom, 60px height, input 40px, send button green
 * ✓ Sidebar: 320px width, 60px header, chat items 72px
 * ✓ Header: 60px height, 40px icon buttons, 36px icons
 * ✓ Chat items: 48px avatar, 12px gap to text, 12px left border for active
 * ✓ All hover states: scale 1.05 on buttons, color shifts on items
 * ✓ Focus states: green outline 2px visible
 * ✓ Dark mode: all components support [data-theme="dark"]
 * ✓ Reduced motion: @media (prefers-reduced-motion: reduce) respected
 * ✓ Accessibility: all touch targets 44px, color contrast WCAG AA
 * ✓ Consistency: no style exceptions, all rules followed
 * 
 */
