import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops! Not Found' }} />
      <View >
        <Link href="/" >
          Go back to Home screen!
        </Link>
      </View>
    </>
  );
}


