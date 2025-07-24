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
  const Item = ({ item, index }: { item: any; index: number }) => (
    <SlideItem
      index={index}
      rounded={rounded}
      style={style}
      source={item.image}
      path={item.path}
    />
  );
  Item.displayName = 'CarouselSlideItem';
  return Item;
};
