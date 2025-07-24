// import { renderItem } from '@/utils/render-item';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';
import { renderItem } from '../../utils/render-item';

export default function HomeScreen() {
  const progress = useSharedValue<number>(0);
  const defaultDataWith6Colors = [
    '#B0604D',
    '#899F9C',
    '#B3C680',
    '#5C6265',
    '#F5D399',
    '#F1F1F1',
  ];
  return (
    <View className="flex-1 items-center justify-start bg-white">
      <Image
        source={require('@/assets/images/moss-eco.png')}
        style={{ width: 140, height: 75 }}
      />
      <View className="flex-1 flex-col gap-3 justify-center">
        <Link href={'../(modes)/(animated)/upload'}>Animated</Link>
        <Carousel
          autoPlayInterval={2000}
          data={defaultDataWith6Colors}
          height={258}
          loop={true}
          pagingEnabled={true}
          snapEnabled={true}
          width={200}
          // style={{
          //   width: window.width,
          // }}
          mode="parallax"
          modeConfig={{
            parallaxScrollingScale: 0.9,
            parallaxScrollingOffset: 50,
          }}
          onProgressChange={progress}
          renderItem={renderItem({ rounded: true })}
        />
      </View>
    </View>
  );
}
