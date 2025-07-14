import { Stack } from 'expo-router';

export default function ModesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* (modes) 그룹의 하위 라우트가 여기에 자동으로 포함됨 */}
    </Stack>
  );
}
