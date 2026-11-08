import Svg, { Path, Rect } from 'react-native-svg';
export default function VoiceIcon({ stop, color = '#fff', send }) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {stop ? (
        <Rect x={6} y={6} width={12} height={12} rx={2} fill={color} />
      ) : send ? (
        <>
          <Path d="m3 3 18 9-18 9 4-9-4-9Z" />
          <Path d="M7 12h14" />
        </>
      ) : (
        <>
          <Rect x={9} y={2} width={6} height={13} rx={3} />
          <Path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8" />
        </>
      )}
    </Svg>
  );
}
