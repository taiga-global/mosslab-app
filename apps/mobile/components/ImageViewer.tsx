import { Image } from 'expo-image';
import { ImageSourcePropType } from 'react-native';

type ImageViewerProps = {
  imgSource: ImageSourcePropType;
  selectedImage?: string;
  height: number;
  width: number;
};

export default function ImageViewer({
  imgSource,
  selectedImage,
  height,
  width,
}: ImageViewerProps) {
  const imageSource = selectedImage ? { uri: selectedImage } : imgSource;

  return (
    <Image source={imageSource} style={{ width: width, height: height }} />
  );
}
