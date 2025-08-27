import { View, Text } from 'react-native';
import { theme } from '../../../lib/theme';
export default function NewPost() {
  return <View style={{ flex:1, backgroundColor: theme.colors.background, alignItems:'center', justifyContent:'center' }}>
    <Text style={{ color: theme.colors.muted }}>Add a Post — tampilan menyusul</Text>
  </View>;
}