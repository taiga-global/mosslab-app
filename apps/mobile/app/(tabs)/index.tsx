import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { View } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-start bg-white">
      <Image
        source={require('@/assets/images/moss-eco.png')}
        style={{ width: 140, height: 75 }}
      />
      <View className="flex-1 flex-col gap-3 justify-center">
        <Link href={'../(modes)/(animated)/upload'}>Animated</Link>
      </View>
    </View>
  );
}
