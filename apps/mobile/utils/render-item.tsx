import { SlideItem } from '@/components/SlideItem';
import { CarouselRenderItem } from 'react-native-reanimated-carousel';

export const renderItem = (): CarouselRenderItem<any> => {
  const Item = ({ item, index }: { item: any; index: number }) => (
    <SlideItem
      index={index}
      source={item.image}
      path={item.path}
      cardType={item.cardType}
      style={{
        width: '100%',
        height: 150,
        backgroundColor: '#fff',
        marginVertical: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      }}
    />
  );
  Item.displayName = 'CarouselSlideItem';
  return Item;
};
