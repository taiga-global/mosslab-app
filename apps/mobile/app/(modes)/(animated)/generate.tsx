import { ActivityIndicator, Alert, Dimensions, Text, View } from 'react-native';
// import ImagePicker from 'react-native-image-crop-picker';

import ImageViewer from '@/components/ImageViewer';
import { HeaderGradient } from '@/components/LayoutGradient';

import { isError } from '@/api';
import {
  downloadGif,
  generate,
  getDownloadUrl,
  requestPresignedUrl,
  uploadToS3,
} from '@/utils/mediaUtils.ts';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Button } from 'tamagui';
const screenWidth = Dimensions.get('window').width;

export default function GenerateScreen() {
  const { imageUri, mimeType } = useLocalSearchParams();
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const uploadAndConvert = useCallback(async () => {
    const uri = typeof imageUri === 'string' ? imageUri : imageUri?.[0];
    let putUrl, key, jobId;

    try {
      ({ putUrl, key } = await requestPresignedUrl(uri, mimeType));
    } catch (error) {
      if (isError(error)) {
        console.log('Presigned URL 요청 실패: ' + error.message);
        alert('Presigned URL 요청 실패: ' + error.message);
        router.back();
      }
      return;
    }

    try {
      await uploadToS3(putUrl, uri);
    } catch (error) {
      if (isError(error)) {
        console.log('S3 업로드 실패: ' + error.message);
        alert('S3 업로드 실패: ' + error.message);
      }
      return;
    }

    try {
      jobId = await generate(key, 'animated');
    } catch (error) {
      if (isError(error)) {
        console.log('변환 요청 실패: ' + error.message);
        alert('변환 요청 실패: ' + error.message);
      }
      return;
    }

    let outputUrl;
    try {
      outputUrl = await getDownloadUrl(jobId);
    } catch (error) {
      if (isError(error)) {
        console.log('변환 상태 요청 실패: ' + error.message);
        alert('변환 상태 요청 실패: ' + error.message);
      }
      return;
    }

    console.log('결과 URL:', outputUrl);

    try {
      const gifUri = await downloadGif(outputUrl);
      setGifUrl(gifUri);
    } catch (error) {
      if (isError(error)) {
        console.log('변환 결과 다운로드 실패: ' + error.message);
        alert('변환 결과 다운로드 실패: ' + error.message);
      }
      return;
    }
  }, [imageUri, mimeType]);

  useEffect(() => {
    Alert.alert('API 실행', 'API를 실행할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '확인',
        onPress: () => {
          setIsConfirmed(true);
          uploadAndConvert();
        },
      },
    ]);
  }, [uploadAndConvert]);

  return (
    isConfirmed && (
      <View className="flex-1">
        <HeaderGradient />
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
        <View className="flex items-center py-6 px-10">
          <Text className="text-2xl font-bold">
            {gifUrl ? '변환 완료' : '변환 중'}
          </Text>
          <Text className="text-base text-gray-500 text-center">
            {gifUrl
              ? '이미지 변환이 완료되었습니다. 영상을 다시 생성하거나 moss eco에 바로 전송할 수 있습니다.'
              : 'AI가 사진을 분석해, 생생하게 움직이는 영상으로 만들어 moss eco에서 생동감 있게 표현합니다.'}
          </Text>
        </View>
        {!gifUrl && <ActivityIndicator className="flex-1" size="large" />}
        {gifUrl && (
          <ImageViewer
            key={gifUrl}
            imgSource={
              typeof gifUrl === 'string'
                ? { uri: gifUrl }
                : require('@/assets/images/animated/sample1.png')
            }
            height={screenWidth / 2}
            width={screenWidth}
          />
        )}
      </View>
    )
  );
}
