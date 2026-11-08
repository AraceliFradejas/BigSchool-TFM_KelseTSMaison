import { Platform, Pressable, StyleSheet, Text } from 'react-native';

export default function Button({
  children,
  title,
  color,
  onPress,
  disabled,
  secondary,
  selected,
  icon,
  ...props
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{
        disabled: Boolean(disabled),
        ...(selected === undefined ? {} : { selected }),
      }}
      disabled={disabled}
      android_ripple={{ color: secondary ? '#b3152b22' : '#ffffff33' }}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        icon && s.withIcon,
        color && { backgroundColor: color, borderColor: color },
        secondary && s.secondary,
        selected && s.selected,
        disabled && s.dim,
        pressed && Platform.OS === 'ios' && s.pressed,
      ]}
      {...props}
    >
      {icon}
      <Text
        style={[
          s.buttonText,
          icon && { flexShrink: 1 },
          secondary && s.secondaryText,
          selected && s.selectedText,
        ]}
      >
        {children ?? title}
      </Text>
    </Pressable>
  );
}
const s = StyleSheet.create({
  button: {
    backgroundColor: '#b3152b',
    borderWidth: 1,
    borderColor: '#b3152b',
    borderRadius: Platform.OS === 'ios' ? 14 : 24,
    overflow: 'hidden',
    paddingVertical: 13,
    paddingHorizontal: 16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withIcon: { flexDirection: 'row', gap: 8 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  secondary: { backgroundColor: '#eeeae3', borderColor: '#b8b2a7' },
  secondaryText: { color: '#242320' },
  selected: { backgroundColor: '#f7dfe3' },
  selectedText: { color: '#a50e27', fontWeight: '700' },
  pressed: { opacity: 0.65, transform: [{ scale: 0.98 }] },
  dim: { opacity: 0.45 },
});
