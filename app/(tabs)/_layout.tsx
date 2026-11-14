import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
const tabs = [
  {name:'discover', title:'Discover', icon:'compass-outline'},
  {name:'reels', title:'Reels', icon:'play-circle-outline'},
  {name:'matches', title:'Matches', icon:'heart-outline'},
  {name:'inbox', title:'Inbox', icon:'chatbubble-outline'},
  {name:'profile', title:'Profile', icon:'person-outline'}
] as const;
export default function TabLayout() {
  return <Tabs screenOptions={{headerShown:false, tabBarActiveTintColor:colors.pink,
    tabBarInactiveTintColor:'#888', tabBarStyle:{height:64,paddingTop:8,paddingBottom:8},
    tabBarLabelStyle:{fontSize:11,fontWeight:'600'}}}>
    {tabs.map(t => <Tabs.Screen key={t.name} name={t.name} options={{
      title:t.title, tabBarIcon:({color,size}) => <Ionicons name={t.icon as any} color={typeof color === 'string' ? color : '#888'} size={size}/>
    }}/>)}
  </Tabs>;
}
