import { View, Text } from 'react-native';
import { Link } from 'expo-router';
export default function RestaurantsHome() {
  return (
    <View>
      <Text>Restaurants</Text>
      <Link href="../1/menu">View first user details</Link>
      <Link href="../2/menu">View second user details</Link>
    </View>
  );
}
