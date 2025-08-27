import { SlideItem } from '@/components/SlideItem';
import { FlatList, type ListRenderItem } from 'react-native';

interface ModeItem {
  cardType: 'animation' | 'voice';
  path: string;
}

export default function ModesList() {
  const CARD_DATA: ModeItem[] = [
    { cardType: 'animation', path: '/(modes)/(animated)/upload' },
    { cardType: 'voice', path: '/(modes)/(audiolized)/upload' },
  ];

  const renderItem: ListRenderItem<ModeItem> = ({ item, index }) => (
    <SlideItem index={index} path={item.path} cardType={item.cardType} />
  );

  return (
    <FlatList
      data={CARD_DATA}
      renderItem={renderItem}
      keyExtractor={(item, index) => `${item.cardType}-${index}`}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingVertical: 20,
        paddingHorizontal: 20,
        gap: 16,
      }}
    />
  );
}
