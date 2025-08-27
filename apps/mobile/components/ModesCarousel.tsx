import { renderItem } from '@/utils/render-item';
import { Dimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';

export default function ModesCarousel() {
  const progress = useSharedValue<number>(0);
  const screenWidth = Dimensions.get('window').width;

  const CARD_DATA = [
    { cardType: 'clock', path: '/(modes)/(clock)/upload' },
    { cardType: 'alarm', path: '/(modes)/(alarm)/upload' },
    { cardType: 'animation', path: '/(modes)/(animated)/upload' },
    { cardType: 'voice', path: '/(modes)/(audiolized)/upload' },
    { cardType: 'sleep', path: '/(modes)/(sleep)/upload' },
  ];

  return (
    <Carousel
      autoPlayInterval={10000}
      autoPlay={true}
      data={CARD_DATA}
      height={300}
      loop={true}
      pagingEnabled={true}
      snapEnabled={true}
      width={screenWidth * 0.9} // 화면 너비의 90% 사용
      mode="vertical-stack"
      modeConfig={{
        snapDirection: 'left',
        stackInterval: 20,
      }}
      // modeConfig={{
      //   parallaxScrollingScale: 1,
      //   parallaxScrollingOffset: 20,
      //   parallaxAdjacentItemScale: 0.75,
      // }}
      onProgressChange={progress}
      renderItem={renderItem()}
    />
  );
}
