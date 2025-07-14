import { Image, View } from "react-native";
import { Button } from "tamagui";
 
export default function index() {
  return (

      <View className="flex-1 items-center justify-between bg-white">
      <Image source={require('../../assets/images/moss-eco.png')} className="w-[100px] h-[40px]" /> 
      <Button/>
    </View>
    
  );
}