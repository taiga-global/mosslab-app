import { ActivityIndicator, Alert, Dimensions, Text, View } from 'react-native';
// import ImagePicker from 'react-native-image-crop-picker';
import api, { isError } from '@/api';
import ImageViewer from '@/components/ImageViewer';
import { HeaderGradient } from '@/components/LayoutGradient';
import {
  downloadAudio,
  generateAudio,
  pollJobStatus,
  requestPresignedUrl,
  uploadToS3,
} from '@/utils/mediaUtils.ts';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Button } from 'tamagui';
const screenWidth = Dimensions.get('window').width;

export default function GenerateScreen() {
  const { imageUri, mimeType } = useLocalSearchParams();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const uploadAndGenerate = useCallback(async () => {
    const uri = typeof imageUri === 'string' ? imageUri : imageUri?.[0];
    let putUrl, key, jobId;

    try {
      ({ putUrl, key } = await requestPresignedUrl(uri, mimeType));
    } catch (error) {
      if (isError(error)) {
        console.log('Presigned URL 요청 실패: ' + error.message);
        alert('Presigned URL 요청 실패: ' + error.message);
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
      jobId = await generateAudio(key);
    } catch (error) {
      if (isError(error)) {
        console.log('변환 요청 실패: ' + error.message);
        alert('변환 요청 실패: ' + error.message);
      }
      return;
    }

    let status;
    try {
      status = await pollJobStatus(jobId);
    } catch (error) {
      if (isError(error)) {
        console.log('변환 상태 요청 실패: ' + error.message);
        alert('변환 상태 요청 실패: ' + error.message);
      }
      return;
    }

    if (status === 'DONE') {
      try {
        const {
          data: { outputUrl },
        } = await api.get(`/jobs/${jobId}`);
        const audioUrl = await downloadAudio(outputUrl);
        setAudioUrl(audioUrl);
      } catch (error) {
        if (isError(error)) {
          console.log('변환 결과 다운로드 실패: ' + error.message);
          alert('변환 결과 다운로드 실패: ' + error.message);
        }
        return;
      }
    }
  }, [imageUri, mimeType]);

  useEffect(() => {
    Alert.alert('API 실행', 'API를 실행할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '확인',
        onPress: () => {
          setIsConfirmed(true);
          uploadAndGenerate();
        },
      },
    ]);
  }, [uploadAndGenerate]);

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
            {audioUrl ? '변환 완료' : '변환 중'}
          </Text>
          <Text className="text-base text-gray-500 text-center">
            {audioUrl
              ? '사진을 분석하여 어울리는 배경음악을 생성했습니다. 다시 시도하거나 moss eco에 바로 전송할 수 있습니다.'
              : 'AI가 사진을 분석해, 어울리는 배경음악을 만들어 moss eco에서 생동감 있게 표현합니다.'}
          </Text>
        </View>
        {!audioUrl && <ActivityIndicator className="flex-1" size="large" />}
        {audioUrl && (
          <View className="flex items-center">
            <Text className="text-lg font-bold">Audio Preview</Text>
            <Button
              theme="primary"
              onPress={() => {
                const sound = new Audio(audioUrl);
                sound.play();
              }}
              variant="outlined"
            >
              <Text className="text-white text-lg font-semibold">
                Play Audio
              </Text>
            </Button>
          </View>
        )}
      </View>
    )
  );
}
