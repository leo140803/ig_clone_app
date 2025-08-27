import { useLocalSearchParams } from 'expo-router';
import ProfileView from './ProfileView';

export default function UserProfile() {
  const { username } = useLocalSearchParams<{ username: string }>();
  return <ProfileView username={username} />;
}