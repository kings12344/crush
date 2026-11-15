import { Tabs } from 'expo-router';
import { Compass, Play, Heart, MessageCircle, UserRound } from 'lucide-react-native';
import { colors } from '../../constants/theme';

const tabs = [
  { name: 'discover', title: 'Discover', Icon: Compass },
  { name: 'reels', title: 'Reels', Icon: Play },
  { name: 'matches', title: 'Matches', Icon: Heart },
  { name: 'inbox', title: 'Inbox', Icon: MessageCircle },
  { name: 'profile', title: 'Profile', Icon: UserRound },
] as const;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.pink,
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { height: 64, paddingTop: 8, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      {tabs.map(({ name, title, Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, size }) => (
              <Icon color={typeof color === 'string' ? color : '#888'} size={size} strokeWidth={2} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
