// import { renderItem } from '@/utils/render-item';
import { Image } from 'expo-image';
import { View } from 'react-native';
import ModesList from '../../components/ModesList';

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-start bg-white">
      <Image
        source={require('@/assets/images/moss-eco.png')}
        style={{ width: 140, height: 75 }}
      />
      <View className="flex-1">
        <ModesList />
      </View>
    </View>
  );
}
