import { LinearGradient } from 'expo-linear-gradient';

export function HeaderGradient() {
  return (
    <LinearGradient
      colors={['#fff', 'transparent']}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 64,
        zIndex: 10,
      }}
      pointerEvents="none"
    />
  );
}
export function BottomGradient() {
  return (
    <LinearGradient
      colors={['transparent', '#fff']}
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 64,
        zIndex: 10,
      }}
      pointerEvents="none"
    />
  );
}
