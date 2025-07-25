// import { renderItem } from '@/utils/render-item';
import { Image } from 'expo-image';
import { View } from 'react-native';
import ModesCarousel from '../../components/ModesCarousel';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-start bg-white">
      <Image
        source={require('@/assets/images/moss-eco.png')}
        style={{ width: 140, height: 75 }}
      />
      <View className="flex-1 flex-col gap-3 justify-center">
        <ModesCarousel />
      </View>
    </View>
  );
}
