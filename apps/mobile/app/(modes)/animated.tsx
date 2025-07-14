import ImageViewer from '@/components/ImageViewer';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Dimensions, FlatList, Text, View } from 'react-native';
import { Button, Theme } from 'tamagui';

const screenWidth = Dimensions.get('window').width;

export default function AnimatedPhotosScreen() {
  const ITEM_PADDING = 10;
  const ITEM_WIDTH = screenWidth / 2 - ITEM_PADDING;
  const [selectedImage, setSelectedImage] = useState<string | undefined>(
    undefined,
  );
  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    } else {
      alert('You did not select any image.');
    }
  };
  const samples = [
    require('@/assets/images/animated/sample1.png'),
    require('@/assets/images/animated/sample2.png'),
    require('@/assets/images/animated/sample3.png'),
    require('@/assets/images/animated/sample4.png'),
    require('@/assets/images/animated/sample5.png'),
    require('@/assets/images/animated/sample6.png'),
  ];

  return (
    <View className="flex-1">
      {/* 맨 위 그라데이션 */}
      <LinearGradient
        colors={['#fff', 'transparent']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          zIndex: 10,
        }}
        pointerEvents="none"
      />
      {/* 맨 아래 그라데이션 */}
      <LinearGradient
        colors={['transparent', '#fff']}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          zIndex: 10,
        }}
        pointerEvents="none"
      />
      <View className="absolute left-0 right-0 bottom-0 z-20 px-4 pb-4">
        <Button color="$primary">사진 업로드</Button>
      </View>
      <Theme name="dark">
        <Button>I have the theme dark</Button>
        <Theme name="pink">
          <Button>I have the theme pink-dark</Button>
        </Theme>
      </Theme>
      <ImageViewer
        imgSource={require('@/assets/images/animated/cover.png')}
        height={300}
        width={screenWidth}
      />
      <View className="flex items-center py-6 px-10">
        <Text className="text-2xl font-bold">움직이는 사진</Text>
        <Text className="text-base text-gray-500 text-center">
          AI가 사진을 분석해, 생생하게 움직이는 영상으로 만들어 moss eco에서
          생동감 있게 표현합니다.
        </Text>
      </View>
      <FlatList
        className="px-2"
        style={{ paddingHorizontal: ITEM_PADDING }}
        data={samples}
        keyExtractor={(_, idx) => idx.toString()}
        numColumns={2}
        contentContainerStyle={{ backgroundColor: '#fff' }}
        columnWrapperStyle={{
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
        renderItem={({ item }) => (
          <ImageViewer imgSource={item} height={130} width={ITEM_WIDTH} />
        )}
      />
    </View>
  );
}
