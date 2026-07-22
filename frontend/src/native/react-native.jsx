// Minimal `react-native` implementation for the browser.
//
// Only the surface the ported CREDO screens actually use is implemented — see
// ./style.js for the RN-style -> CSS translation that all of these run through.
import { createContext, forwardRef, useContext, useEffect, useRef, useState } from 'react';
import { css, flatten, TEXT_STYLE_KEYS } from './style';
import './native.css';

/* ── StyleSheet ─────────────────────────────────────────────────────────── */

const absoluteFillObject = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };

export const StyleSheet = {
  create: (styles) => styles,
  flatten,
  absoluteFill: absoluteFillObject,
  absoluteFillObject,
  hairlineWidth: 1,
  compose: (a, b) => [a, b],
};

/* ── Platform / Dimensions ──────────────────────────────────────────────── */

export const Platform = {
  OS: 'web',
  Version: 0,
  select: (spec) => (('web' in spec) ? spec.web : spec.default),
};

// The app fills the viewport at every size, so "window" really is the window. Screens read
// Dimensions at module scope for one-off layout maths (ScreenBackground's light pools);
// like on native, that value does not react to a resize. useWindowDimensions does — it is
// the RN API to reach for when layout must adapt, and SegmentedTabBar uses it to switch
// between the phone tab bar and the desktop rail.
const FALLBACK = { width: 402, height: 932 };

export const Dimensions = {
  get: (dim) =>
    dim === 'screen' || dim === 'window'
      ? {
          width: typeof window === 'undefined' ? FALLBACK.width : window.innerWidth,
          height: typeof window === 'undefined' ? FALLBACK.height : window.innerHeight,
          scale: 1,
          fontScale: 1,
        }
      : { width: 0, height: 0, scale: 1, fontScale: 1 },
  addEventListener: () => ({ remove: () => {} }),
};

export function useWindowDimensions() {
  const [size, setSize] = useState(() => Dimensions.get('window'));
  useEffect(() => {
    const onResize = () => setSize(Dimensions.get('window'));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

/* ── View ───────────────────────────────────────────────────────────────── */

// RN's "box-none" (transparent to touches itself, children still tappable) has no direct
// CSS equivalent — .rn-box-none pairs `pointer-events: none` with a child rule that
// re-enables it. "box-only" is the inverse and maps straight to `auto`.
function pointerEventsClass(value) {
  if (value === 'box-none') return ' rn-box-none';
  if (value === 'none') return ' rn-box-hidden';
  return '';
}

export const View = forwardRef(function View(
  { style, children, pointerEvents, onLayout, accessibilityRole, accessibilityLabel, testID, className, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      // `className` is merged, never replaced — the layer's own layout classes must
      // survive. It is the escape hatch for the few responsive rules that have to live in
      // CSS (media queries) rather than in an RN style object.
      className={`rn-view${pointerEventsClass(pointerEvents)}${className ? ` ${className}` : ''}`}
      style={css(style)}
      role={accessibilityRole === 'image' ? 'img' : accessibilityRole}
      aria-label={accessibilityLabel}
      data-testid={testID}
      {...rest}
    >
      {children}
    </div>
  );
});

/* ── Text ───────────────────────────────────────────────────────────────── */

const TextAncestorContext = createContext(false);

export const Text = forwardRef(function Text(
  { style, children, numberOfLines, accessibilityRole, accessibilityLabel, onPress, testID, ...rest },
  ref
) {
  const nested = useContext(TextAncestorContext);
  const resolved = css(style);

  if (numberOfLines === 1) {
    Object.assign(resolved, { display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
  } else if (numberOfLines > 1) {
    Object.assign(resolved, {
      display: '-webkit-box',
      WebkitLineClamp: numberOfLines,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
    });
  }

  const node = (
    <span
      ref={ref}
      className="rn-text"
      style={resolved}
      role={accessibilityRole}
      aria-label={accessibilityLabel}
      data-testid={testID}
      onClick={onPress}
      {...rest}
    >
      {children}
    </span>
  );

  // Only the outermost Text opens the context; nested <Text> then stays inline so
  // mixed-style sentences flow as one paragraph, exactly like RN.
  return nested ? node : <TextAncestorContext.Provider value>{node}</TextAncestorContext.Provider>;
});

/* ── Pressable ──────────────────────────────────────────────────────────── */

export const Pressable = forwardRef(function Pressable(
  { style, children, onPress, onLongPress, disabled, hitSlop, accessibilityRole, accessibilityLabel, accessibilityState, testID, ...rest },
  ref
) {
  const [pressed, setPressed] = useState(false);
  const longPressTimer = useRef(null);
  const resolved = css(typeof style === 'function' ? style({ pressed }) : style);

  // RN's hitSlop grows the touch target outside the box; negative margins + padding
  // reproduce it without shifting layout.
  if (hitSlop) {
    const s = typeof hitSlop === 'number' ? { top: hitSlop, bottom: hitSlop, left: hitSlop, right: hitSlop } : hitSlop;
    resolved.padding = `${s.top ?? 0}px ${s.right ?? 0}px ${s.bottom ?? 0}px ${s.left ?? 0}px`;
    resolved.margin = `${-(s.top ?? 0)}px ${-(s.right ?? 0)}px ${-(s.bottom ?? 0)}px ${-(s.left ?? 0)}px`;
  }

  return (
    <div
      ref={ref}
      className="rn-view rn-pressable"
      style={{ ...resolved, ...(disabled ? { cursor: 'default', pointerEvents: 'auto' } : null) }}
      role={accessibilityRole || 'button'}
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-selected={accessibilityState?.selected}
      aria-label={accessibilityLabel}
      data-testid={testID}
      onClick={disabled ? undefined : onPress}
      onKeyDown={(e) => {
        if (disabled || !onPress) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPress(e);
        }
      }}
      onPointerDown={() => {
        setPressed(true);
        if (onLongPress) longPressTimer.current = setTimeout(onLongPress, 500);
      }}
      onPointerUp={() => {
        setPressed(false);
        clearTimeout(longPressTimer.current);
      }}
      onPointerLeave={() => {
        setPressed(false);
        clearTimeout(longPressTimer.current);
      }}
      {...rest}
    >
      {typeof children === 'function' ? children({ pressed }) : children}
    </div>
  );
});

export const TouchableOpacity = Pressable;

/* ── ScrollView ─────────────────────────────────────────────────────────── */

export const ScrollView = forwardRef(function ScrollView(
  { style, contentContainerStyle, children, horizontal, showsVerticalScrollIndicator, showsHorizontalScrollIndicator, keyboardShouldPersistTaps, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={`rn-view rn-scroll${horizontal ? ' rn-scroll-horizontal' : ''}`}
      style={{ flex: style ? undefined : 1, ...css(style) }}
      {...rest}
    >
      <div className="rn-scroll-content" style={css(contentContainerStyle)}>
        {children}
      </div>
    </div>
  );
});

/* ── TextInput ──────────────────────────────────────────────────────────── */

export const TextInput = forwardRef(function TextInput(
  {
    style,
    value,
    onChangeText,
    onSubmitEditing,
    placeholder,
    placeholderTextColor,
    secureTextEntry,
    keyboardType,
    autoCapitalize,
    autoCorrect,
    editable = true,
    multiline,
    numberOfLines,
    maxLength,
    returnKeyType,
    textAlignVertical,
    ...rest
  },
  ref
) {
  const Tag = multiline ? 'textarea' : 'input';
  const resolved = css(style);
  // placeholderTextColor has no inline-style equivalent; drive the ::placeholder rule
  // through a custom property the stylesheet reads.
  const withPlaceholder = placeholderTextColor
    ? { ...resolved, '--rn-placeholder': placeholderTextColor }
    : resolved;

  const inputMode =
    keyboardType === 'email-address'
      ? 'email'
      : keyboardType === 'numeric' || keyboardType === 'number-pad'
        ? 'numeric'
        : keyboardType === 'phone-pad'
          ? 'tel'
          : undefined;

  return (
    <Tag
      ref={ref}
      className="rn-input"
      style={withPlaceholder}
      value={value ?? ''}
      onChange={(e) => onChangeText?.(e.target.value)}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter' && onSubmitEditing) onSubmitEditing(e);
      }}
      placeholder={placeholder}
      type={secureTextEntry ? 'password' : 'text'}
      inputMode={inputMode}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect === false ? 'off' : undefined}
      disabled={!editable}
      rows={multiline ? numberOfLines || 4 : undefined}
      maxLength={maxLength}
      enterKeyHint={returnKeyType}
      {...rest}
    />
  );
});

/* ── ActivityIndicator ──────────────────────────────────────────────────── */

export function ActivityIndicator({ color = '#10192B', size = 'small', style }) {
  const px = size === 'large' ? 32 : 18;
  const border = size === 'large' ? 3 : 2;
  return (
    <div className="rn-view" style={{ alignItems: 'center', justifyContent: 'center', ...css(style) }}>
      <div
        className="rn-activity-indicator"
        role="progressbar"
        style={{
          width: px,
          height: px,
          borderWidth: border,
          borderColor: `${color} transparent ${color} ${color}`,
          opacity: 0.85,
        }}
      />
    </div>
  );
}

/* ── Switch ─────────────────────────────────────────────────────────────── */

export function Switch({ value, onValueChange, disabled }) {
  return (
    <div
      className="rn-switch"
      data-on={!!value}
      role="switch"
      tabIndex={0}
      aria-checked={!!value}
      aria-disabled={disabled || undefined}
      onClick={() => !disabled && onValueChange?.(!value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!disabled) onValueChange?.(!value);
        }
      }}
    >
      <div className="rn-switch-thumb" />
    </div>
  );
}

/* ── KeyboardAvoidingView ───────────────────────────────────────────────── */

// The browser handles soft-keyboard insets itself; this is a plain passthrough View.
export function KeyboardAvoidingView({ behavior, keyboardVerticalOffset, ...rest }) {
  return <View {...rest} />;
}

/* ── Alert ──────────────────────────────────────────────────────────────── */

export const Alert = {
  alert(title, message, buttons) {
    const body = [title, message].filter(Boolean).join('\n\n');
    // Two-button alerts in this app are always confirm/cancel with the destructive or
    // primary action last, matching window.confirm's OK slot.
    if (Array.isArray(buttons) && buttons.length > 1) {
      const confirmBtn = buttons.find((b) => b.style !== 'cancel') ?? buttons[buttons.length - 1];
      const cancelBtn = buttons.find((b) => b.style === 'cancel');
      if (window.confirm(body)) confirmBtn?.onPress?.();
      else cancelBtn?.onPress?.();
      return;
    }
    window.alert(body);
    buttons?.[0]?.onPress?.();
  },
};

/* ── Share ──────────────────────────────────────────────────────────────── */

export const Share = {
  async share({ message, url, title } = {}) {
    const shareUrl = url ?? message;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: message, url });
        return { action: 'sharedAction' };
      } catch {
        // User dismissed the sheet, or the browser refused the payload — fall through
        // to the clipboard so the action still does something useful.
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl ?? '');
      return { action: 'sharedAction' };
    } catch {
      return { action: 'dismissedAction' };
    }
  },
  sharedAction: 'sharedAction',
  dismissedAction: 'dismissedAction',
};

/* ── Linking ────────────────────────────────────────────────────────────── */

export const Linking = {
  openURL: async (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  },
  canOpenURL: async () => true,
};

/* ── Animated (non-reanimated call sites) ───────────────────────────────── */

export const Animated = { View, Text, ScrollView, createAnimatedComponent: (C) => C };

export { TEXT_STYLE_KEYS };

export default {
  StyleSheet,
  Platform,
  Dimensions,
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Alert,
  Share,
  Linking,
  Animated,
  useWindowDimensions,
};
