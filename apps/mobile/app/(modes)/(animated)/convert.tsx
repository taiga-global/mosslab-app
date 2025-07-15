import { ActivityIndicator, Dimensions, Text, View } from 'react-native';
// import ImagePicker from 'react-native-image-crop-picker';
import ImageViewer from '@/components/ImageViewer';
import { HeaderGradient } from '@/components/LayoutGradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button } from 'tamagui';

const screenWidth = Dimensions.get('window').width;

export default function ConvertScreen() {
  const { imageUri } = useLocalSearchParams();
  const [isConverted, setIsConverted] = useState<boolean>(false);
  // const onPress = () => {
  //   // 변환 버튼 클릭 시 동작 추가 (예시: 변환 상태로 변경)
  //   setIsConverted(true);
  // };

  useEffect(() => {}, []);

  return (
    <View className="flex-1">
      <HeaderGradient />
      {/* <BottomGradient /> */}
      <View className="absolute left-0 right-0 bottom-10 z-20 px-10">
        <Button
          theme="primary"
          onPress={() => {
            router.back();
          }}
          variant="outlined"
        >
          <Text className="text-white text-lg font-semibold">취소</Text>
        </Button>
      </View>
      <ImageViewer
        imgSource={
          typeof imageUri === 'string'
            ? { uri: imageUri }
            : require('@/assets/images/animated/sample1.png')
        }
        height={300}
        width={screenWidth}
      />
      <View className="flex items-center pt-6 px-10">
        <Text className="text-2xl font-bold">변환 중</Text>
        <Text className="text-base text-gray-500 text-center">
          AI가 사진을 분석해, 생생하게 움직이는 영상으로 만들어 moss eco에서
          생동감 있게 표현합니다.
        </Text>
      </View>
      {!isConverted && <ActivityIndicator className="flex-1" size="large" />}
    </View>
  );
}
