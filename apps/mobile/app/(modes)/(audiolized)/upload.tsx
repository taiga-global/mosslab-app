import ImageViewer from '@/components/ImageViewer';
import { HeaderGradient } from '@/components/LayoutGradient';
import { useActionSheet } from '@expo/react-native-action-sheet';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Dimensions, FlatList, Text, View } from 'react-native';
import { Button } from 'tamagui';

const screenWidth = Dimensions.get('window').width;

export default function UploadScreen() {
  const ITEM_PADDING = 10;
  const ITEM_WIDTH = screenWidth / 2 - ITEM_PADDING;
  const { showActionSheetWithOptions } = useActionSheet();
  const router = useRouter();

  const onPress = () => {
    const options = ['Camera', 'Album', 'Cancel'];

    // const destructiveButtonIndex = 0;
    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        // destructiveButtonIndex,
      },
      (selectedIndex?: number) => {
        switch (selectedIndex) {
          case 0:
            pickImageFromCamera();
            break;
          case 1:
            pickImageFromAlbum();
            break;

          case cancelButtonIndex:
          // Canceled
        }
      },
    );
  };
  const pickImageFromAlbum = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
      aspect: [2, 1],
    });

    if (!result.canceled) {
      router.push({
        pathname: '../generate',
        params: {
          imageUri: result.assets[0].uri,
          mimeType: result.assets[0].mimeType,
        },
      });
    } else {
      alert('이미지를 선택하지 않았습니다.');
    }
  };

  const pickImageFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      alert('카메라 권한이 필요합니다.');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 1,
      aspect: [2, 1],
    });

    if (!result.canceled) {
      // setSelectedImage(result.assets[0].uri);
      router.push({
        pathname: '../generate',
        params: {
          imageUri: result.assets[0].uri,
          mimeType: result.assets[0].mimeType,
        },
      });
    } else {
      alert('이미지를 선택하지 않았습니다.');
    }
  };

  const samples = [
    require('@/assets/images/audiolized/sample1.png'),
    require('@/assets/images/audiolized/sample2.png'),
    require('@/assets/images/audiolized/sample3.png'),
  ];

  return (
    <View className="flex-1">
      <HeaderGradient />
      <View className="absolute left-0 right-0 bottom-10 z-20 px-10">
        <Button theme="primary" onPress={onPress}>
          <Text className="text-white text-lg font-semibold">사진 업로드</Text>
        </Button>
      </View>
      <FlatList
        className="px-0"
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
        ListHeaderComponent={
          <>
            <ImageViewer
              imgSource={require('@/assets/images/audiolized/cover.png')}
              height={300}
              width={screenWidth}
            />
            <View className="flex items-center py-6 px-10">
              <Text className="text-2xl font-bold">배경음악 생성</Text>
              <Text className="text-base text-gray-500 text-center">
                AI가 사진을 분석해, 어울리는 배경음악을 만들어 moss eco에서
                감각적으로 표현합니다.
              </Text>
            </View>
          </>
        }
      />
    </View>
  );
}
