import { PURPLE_IMAGES } from '@/constants/purple-images';
import { Route, useRouter } from 'expo-router';
import React, { useMemo, useRef } from 'react';
import {
  ImageSourcePropType,
  type ImageStyle,
  PanResponder,
  type StyleProp,
  StyleSheet,
  type ViewProps,
} from 'react-native';
import type { AnimatedProps } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

interface Props extends AnimatedProps<ViewProps> {
  style?: StyleProp<ImageStyle>;
  index?: number;
  rounded?: boolean;
  source?: ImageSourcePropType;
  path?: string; // 추가
}

export const SlideItem: React.FC<Props> = (props) => {
  const router = useRouter();
  const startX = useRef(0);
  const startY = useRef(0);
  const {
    style,
    index = 0,
    rounded = false,
    testID,
    path,
    ...animatedViewProps
  } = props;

  const source = useMemo(
    () => props.source || PURPLE_IMAGES[index % PURPLE_IMAGES.length],
    [index, props.source],
  );

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

  return (
    <Animated.View testID={testID} style={{ flex: 1 }} {...animatedViewProps}>
      <Animated.Image
        style={[style, styles.container, rounded && { borderRadius: 15 }]}
        source={source}
        resizeMode="cover"
      />
      {path && (
        <Animated.View
          style={StyleSheet.absoluteFill}
          {...panResponder.panHandlers}
        />
      )}
      {/* {path && (
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={() => router.push(path as Route)}
        />
      )} */}
      {/* <View style={styles.overlay}>
        <View style={styles.overlayTextContainer}>
          <Text style={styles.overlayText}>{index}</Text>
        </View>
      </View> */}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  overlayTextContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 10,
    borderRadius: 10,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
