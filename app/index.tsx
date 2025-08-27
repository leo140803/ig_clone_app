// app/index.tsx
import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth-context';
import { View, ActivityIndicator } from 'react-native';
import { theme } from '../lib/theme';

export default function Index() {
  const { loading, user } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems:'center', justifyContent:'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator />
      </View>
    );
  }
  return <Redirect href={user ? '/(app)/home' : '/(auth)/login'} />;
}
