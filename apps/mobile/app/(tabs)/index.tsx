import ImageViewer from '@/components/ImageViewer';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { View } from 'react-native';
import { Button } from 'tamagui';

export default function HomeScreen() {
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
  return (
    <View className="flex-1 items-center justify-start bg-white">
      <Image
        source={require('../../assets/images/moss-eco.png')}
        style={{ width: 100, height: 40 }}
      />
      <View className="flex-1 flex-col gap-3 justify-center">
        <ImageViewer
          imgSource={require('../../assets/images/moss-eco.png')}
          selectedImage={selectedImage}
        />
        <Button onPress={pickImageAsync}>open modal</Button>
      </View>
    </View>
  );
}
