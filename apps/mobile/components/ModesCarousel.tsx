import { renderItem } from '@/utils/render-item';
import { useSharedValue } from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';

export default function ModesCarousel() {
  const progress = useSharedValue<number>(0);

  const data = [
    {
      image: require('@/assets/images/animated/sample1.png'),
      path: '/(modes)/(animated)/upload',
    },
    {
      image: require('@/assets/images/animated/sample2.png'),
      path: '/(modes)/(audiolized)/upload',
    },
    // ...더 추가
  ];
  return (
    <Carousel
      autoPlayInterval={10000}
      autoPlay={true}
      data={data}
      height={300}
      loop={true}
      pagingEnabled={true}
      snapEnabled={true}
      width={400}
      mode="parallax"
      modeConfig={{
        parallaxScrollingScale: 0.9,
        parallaxScrollingOffset: 50,
      }}
      onProgressChange={progress}
      renderItem={renderItem({ rounded: true })}
    />
  );
}
