import { ActivityIndicator, Dimensions, Text, View } from 'react-native';
// import ImagePicker from 'react-native-image-crop-picker';
import api from '@/api';
import ImageViewer from '@/components/ImageViewer';
import { HeaderGradient } from '@/components/LayoutGradient';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button } from 'tamagui';

const screenWidth = Dimensions.get('window').width;

export default function ConvertScreen() {
  const { imageUri, mimeType } = useLocalSearchParams();
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  // const onPress = () => {
  //   // 변환 버튼 클릭 시 동작 추가 (예시: 변환 상태로 변경)
  //   setIsConverted(true);
  // };

  async function uploadAndConvert() {
    const uri = typeof imageUri === 'string' ? imageUri : imageUri?.[0];

    const {
      data: { putUrl, key },
    } = await api.post('/upload-url', {
      filename: uri.split('/').pop(),
      mime: mimeType,
    });

    // 3. 파일을 읽어 Blob (or ArrayBuffer)
    const fileBuffer = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const blob = Buffer.from(fileBuffer, 'base64');

    // 4. S3 Presigned URL로 업로드 (PUT)
    await axios.put(putUrl, blob, {
      headers: { 'Content-Type': mimeType },
    });

    // 5. 변환 요청
    const {
      data: { jobId },
    } = await api.post('/convert', { key });

    // 6. 폴링으로 상태 확인
    let status = 'PENDING';
    while (status === 'PENDING') {
      const { data } = await api.get(`/jobs/${jobId}`);
      status = data.status;
      await new Promise((r) => setTimeout(r, 1500));
    }

    if (status === 'DONE') {
      // 7. 결과 GIF presigned URL 받아서 <Image/>로 표시
      const {
        data: { outputUrl },
      } = await api.get(`/jobs/${jobId}`);
      setGifUrl(outputUrl);
    }
  }

  useEffect(() => {
    uploadAndConvert();
  }, []);

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
      {!gifUrl && <ActivityIndicator className="flex-1" size="large" />}
      {gifUrl}
    </View>
  );
}
