import { Image } from 'expo-image';
import { ImageSourcePropType } from 'react-native';

type Props = {
  imgSource: ImageSourcePropType;
  selectedImage?: string;
};

export default function ImageViewer({ imgSource, selectedImage }: Props) {
  const imageSource = selectedImage ? { uri: selectedImage } : imgSource;

  return <Image source={imageSource} style={{ width: 400, height: 100 }} />;
}
