# Component Inventory (Shared Components)

Location: `mobile/src/components/`

## PulseLogo.js
Brand logo component with animated drawing.

| Element | Purpose |
|---|---|
| `PulseLogo` | Animated "MacroPulse" logo: bolt path draws upward (~300ms), name fades in, dot flows along bolt, "Pulse" text breathes (opacity pulse loop). |
| `LiveDot` | Green pulsing dot with ripple ring for "live" indicator. |

**`PulseLogo` props:**
| Prop | Type | Default | Notes |
|---|---|---|---|
| `size` | number | 30 | SVG viewBox 24x24 scaled |
| `showText` | boolean | true | Show "MacroPulse" text |
| `scale` | number | 1 | Scales font size of text |
| `textColor` | string | `COLORS.text` | Color of "Macro" |
| `pulseColor` | string | `COLORS.primary` | Bolt + "Pulse" color |
| `onDrawn` | function | — | Called after ~620ms (draw + fade complete) |

**`LiveDot` props:** `size` (default 8), `color` (default `COLORS.success`).

**Animations:** staggered draw via `strokeDashoffset`, fade, flowing dot (uses `Animated.loop` with `useNativeDriver`).

## Card.js
Shared surface container.

**Props:** `children`, `style`, `onPress` (→ becomes `TouchableOpacity`), `borderColor`, `radius` (default 14).
Default styles: `COLORS.surface`, border `COLORS.border`, subtle shadow, elevation 1.

## ErrorBoundary.js
Class-based React error boundary wrapping every tab view in App.js. On error, shows a fallback UI. **DETAIL ON FALLBACK RENDER: not shown in source annotation; the boundary catches render/lifecycle errors and renders a fallback screen.** (See file for exact fallback text.)

`REQUIRES RUNTIME VERIFICATION`: fallback message content is defined in the component but is only observable when an error is thrown.

## TabIcons.js
Bottom-tab navigation icons. Each supports `size`, `color`, `variant` (`'outline'` | `'solid'`), `strokeWidth`.

| Export | Meaning |
|---|---|
| `FlameIcon` | "Tin nóng" (hot news) |
| `MarketIcon` | "Vàng XAU" (chart candles) |
| `CalendarDotIcon` | "Lịch KT" (calendar grid) |
| `BookmarkIcon` | "Quan tâm" (bookmark) |
| `RadioIcon` | "Nguồn tin" (RSS arcs) |
| `BoltMark` | Bolt/brand mark (used in TradingViewScreen + notification toasts) |

## UIIcons.js
Generic UI icons (Feather/Sparkles-inspired, hand-drawn SVG). Each supports `size`, `color`, `strokeWidth`.

| Export | Default size | Notes |
|---|---|---|
| `RefreshIcon` | 18 | Circular arrow — used for refresh actions/spinners |
| `SearchIcon` | 18 | Magnifier — search input |
| `CloseIcon` | 18 | X — close/clear |
| `PencilIcon` | 16 | Edit — source management |
| `ChevronUpIcon` | 16 | Up chevron — today button |
| `DownloadIcon` | 18 | Download — install CTA |
| `TrashIcon` | 16 | Trash — (exported, not currently referenced in views) `NOT FOUND` in view usage |
| `AlertCircleIcon` | 18 | Warning — toast type icon |
| `XIcon` | 14 | Small X — dismiss chips/CTA |
| `CheckIcon` | 18 | Checkmark — toast success |
| `InfoIcon` | 18 | Info circle — toast info |

## TranslatedText.js
Async English→Vietnamese title translation with caching.

Renders `<Text>` with translated title if available, falls back to original.

**Props:** `text`, plus all props passed through to `<Text>` (style, numberOfLines, etc.).
**Implementation:** calls `translateToVietnamese(text)` (TranslationService), handles cancellation on unmount / text change.
**Caveat:** `TranslatedText` renders **after** async resolves, so `numberOfLines` gets a translated title that may be shorter/longer than the original. `UNKNOWN`: exact height behavior on title change.

## ToastHost.js
Global toast renderer. Subscribes to ToastService `subscribeToasts()`. Renders up to `MAX_TOASTS=3` as absolutely-positioned rows at top of app.

**Toast types:** `success`, `error`, `warning`, `info` — each with a color, icon, label ("THÀNH CÔNG"/"LỖI"/"CẢNH BÁO"/"THÔNG BÁO"), badge text.

**ToastRow:** slide-in spring animation, swipe-to-dismiss via `useSwipeDismiss`, message split by `\n` into bullet rows, actions rendered as pills, always shows a "Để sau" pill.

## useSwipeDismiss.js (hook)
`useSwipeDismiss(onDismiss)` — returns `panHandlers`, `drag` (Animated value). Implements horizontal drag threshold of 90px, flings off-screen on release. Used by `ToastHost.js` and `NotificationToast.js`.

## useOnlineStatus.js (hook)
Returns `{ online: boolean, justReturned: boolean }`.
- Web: reads `navigator.onLine`, listens to `online`/`offline` window events. On reconnect, sets `justReturned=true` for 3s.
- Native: always returns `online=true` (no NetInfo dependency). `NOT IMPLEMENTED`: real connectivity on iOS/Android — status is always "online".