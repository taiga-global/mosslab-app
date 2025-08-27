import { Route, useRouter } from 'expo-router';
import React, { useRef } from 'react';
import {
  ImageSourcePropType,
  type ImageStyle,
  PanResponder,
  type StyleProp,
  Text,
  View,
  type ViewProps,
} from 'react-native';

interface Props extends ViewProps {
  style?: StyleProp<ImageStyle>;
  index?: number;
  source?: ImageSourcePropType;
  path?: string;
  cardType: 'animation' | 'voice';
}

export const SlideItem: React.FC<Props> = (props) => {
  const router = useRouter();
  const startX = useRef(0);
  const startY = useRef(0);
  const { testID, path } = props;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        startX.current = evt.nativeEvent.pageX;
        startY.current = evt.nativeEvent.pageY;
      },
      onPanResponderRelease: (evt) => {
        const dx = Math.abs(evt.nativeEvent.pageX - startX.current);
        const dy = Math.abs(evt.nativeEvent.pageY - startY.current);
        // 10px 이하 이동이면 탭으로 간주
        if (dx < 10 && dy < 10 && path) {
          router.push(path as Route);
        }
      },
    }),
  ).current;

  const renderCardContent = () => {
    switch (props.cardType) {
      case 'animation':
        return (
          <View className="flex flex-col items-start  w-full">
            <Text className="text-2xl font-semibold">Animation</Text>
            <View>
              <Text className="text-lg">🦦 Generate Animation</Text>
            </View>
          </View>
        );
      case 'voice':
        return (
          <View className="flex flex-col items-start  w-full">
            <Text className="text-2xl font-semibold">Audiolize</Text>
            <View>
              <Text className="text-lg">🎵 Generate Background Music</Text>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View
      testID={testID}
      className="h-fit w-[320px] rounded-full p-6 px-10 flex items-center bg-white"
      style={[
        styles.shadowContainer,
        props.style, // 외부에서 전달된 스타일도 적용
      ]}
      {...panResponder.panHandlers}
    >
      {renderCardContent()}
    </View>
  );
};
const styles = {
  shadowContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5, // Android 그림자
  },
};
