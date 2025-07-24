import { SlideItem } from '@/components/SlideItem';
import { ImageStyle, StyleProp } from 'react-native';
import { CarouselRenderItem } from 'react-native-reanimated-carousel';

interface Options {
  rounded?: boolean;
  style?: StyleProp<ImageStyle>;
}

export const renderItem = ({
  rounded = false,
  style,
}: Options = {}): CarouselRenderItem<any> => {
  const Item = ({ index }: { index: number }) => (
    <SlideItem index={index} rounded={rounded} style={style} />
  );
  Item.displayName = 'CarouselSlideItem';
  return Item;
};
