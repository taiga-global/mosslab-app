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

  async function uploadAndConvert() {
    const uri = typeof imageUri === 'string' ? imageUri : imageUri?.[0];
    let putUrl, key, jobId, gifUrl;
    try {
      console.log('1. upload-url 요청 시작');
      const { data } = await api.post('upload-url', {
        filename: uri.split('/').pop(),
        mime: mimeType,
      });
      putUrl = data.putUrl;
      key = data.key;
      console.log('1. upload-url 요청 성공:', { putUrl, key });
    } catch (e) {
      console.log('1. upload-url 에러:', e);
      return;
    }

    // 3. 파일을 읽어 Blob (or ArrayBuffer)
    try {
      console.log('2. 파일 읽기 시작');
      const fileBuffer = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('2. 파일 읽기 완료');
      const blob = await (
        await fetch(`data:${mimeType};base64,${fileBuffer}`)
      ).blob();
      console.log('2. blob 생성 완료', blob);

      if (!putUrl) {
        console.log('2. putUrl이 없음');
        return;
      }
      const response = await axios.put(putUrl, blob, {
        headers: { 'Content-Type': mimeType },
      });
      console.log(
        '2. S3 업로드 응답:',
        response.status,
        response.statusText,
        response.headers,
      );
    } catch (e) {
      console.log('2. S3 업로드 에러:', e);
      return;
    }

    try {
      console.log('3. 변환 요청 시작');
      const { data } = await api.post('/convert', { key });
      jobId = data.jobId;
      console.log('3. 변환 요청 성공:', jobId);
    } catch (e) {
      console.log('3. 변환 요청 에러:', e);
      return;
    }

    // 6. 폴링으로 상태 확인
    let status = 'PENDING';
    while (status === 'PENDING') {
      try {
        console.log('4. 폴링 상태 확인 중...');
        const { data } = await api.get(`/jobs/${jobId}`);
        status = data.status;
        console.log('4. 폴링 응답:', data);
        await new Promise((r) => setTimeout(r, 1500));
      } catch (e) {
        console.log('4. 폴링 에러:', e);
        return;
      }
    }

    if (status === 'DONE') {
      // 7. 결과 GIF presigned URL 받아서 <Image/>로 표시
      try {
        console.log('5. 결과 GIF presigned URL 요청');
        const {
          data: { outputUrl },
        } = await api.get(`/jobs/${jobId}`);
        setGifUrl(outputUrl);
        console.log('5. 결과 GIF presigned URL 성공:', outputUrl);
      } catch (e) {
        console.log('5. 결과 GIF presigned URL 에러:', e);
        return;
      }
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
