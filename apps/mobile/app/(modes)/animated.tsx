import ImageViewer from '@/components/ImageViewer';
import { useActionSheet } from '@expo/react-native-action-sheet';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Dimensions, FlatList, Text, View } from 'react-native';
// import ImagePicker from 'react-native-image-crop-picker';
import { Button } from 'tamagui';

const screenWidth = Dimensions.get('window').width;

export default function AnimatedPhotosScreen() {
  const ITEM_PADDING = 10;
  const ITEM_WIDTH = screenWidth / 2 - ITEM_PADDING;
  const [selectedImage, setSelectedImage] = useState<string | undefined>(
    undefined,
  );
  const { showActionSheetWithOptions } = useActionSheet();

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
      setSelectedImage(result.assets[0].uri);
    } else {
      alert('You did not select any image.');
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
      setSelectedImage(result.assets[0].uri);
    } else {
      alert('You did not select any image.');
    }
  };

  //   const pickImageAsync = async () => {
  //     try {
  //       const image = await ImagePicker.openPicker({
  //         width: 400,
  //         height: 200,
  //         cropping: true,
  //       });
  //       if (image && image.path) {
  //         setSelectedImage(image.path);
  //       } else {
  //         alert('You did not select any image.');
  //       }
  //     } catch (e) {
  //       alert('You did not select any image.');
  //     }
  //   };
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
      <HeaderGradient />
      <BottomGradient />
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
              imgSource={require('@/assets/images/animated/cover.png')}
              height={300}
              width={screenWidth}
            />
            <View className="flex items-center py-6 px-10">
              <Text className="text-2xl font-bold">움직이는 사진</Text>
              <Text className="text-base text-gray-500 text-center">
                AI가 사진을 분석해, 생생하게 움직이는 영상으로 만들어 moss
                eco에서 생동감 있게 표현합니다.
              </Text>
            </View>
          </>
        }
      />
    </View>
  );
}

function HeaderGradient() {
  return (
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
  );
}
function BottomGradient() {
  return (
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
  );
}
