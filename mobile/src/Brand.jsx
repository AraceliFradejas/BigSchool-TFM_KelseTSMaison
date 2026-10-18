// Same vector paths and typography as the web BrandLogo; adapted to native SVG.
import Svg, { G, Path, Text } from 'react-native-svg';
export default function Brand() {
  return (
    <Svg
      width={145}
      height={84}
      viewBox="0 0 800 460"
      accessibilityLabel="KelseTS Maison"
      accessible
    >
      <G fill="none" stroke="#242320" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round">
        <Path d="m300 100-13-52 28 21 11-33 16 24 20-45 20 45 17-24 12 33 27-21-13 52Z" />
        <Path d="M302 114q59-15 119 0" />
      </G>
      <Text x={10} y={320} fill="#242320" fontFamily="Georgia" fontSize={220} letterSpacing={-8}>
        Kelse
      </Text>
      <G fill="none" stroke="#b3152b" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M465 157c-22-28 56-41 122-50 57-8 123-11 179-15M612 99c-34 66-77 155-117 259" />
        <Path d="M700 159c-5-31-58-22-87-5-32 19-37 45-19 65 15 16 51 30 65 52 22 36-1 68-33 81-25 11-47 11-55-3" />
      </G>
      <Text x={130} y={423} fill="#242320" fontFamily="Helvetica" fontSize={60} letterSpacing={13}>
        MAISON
      </Text>
    </Svg>
  );
}
