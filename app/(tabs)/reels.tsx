import { Text, View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { demoVideos } from '../../data/demo';
import { colors } from '../../constants/theme';
export default function Reels() {
 const { session } = useAuth();
 const requireSignIn = () => router.push(session ? '/pending' : '/(auth)/login');
 return <Screen>
  <Heading eyebrow="CRUSH SOCIAL" title="Reels" subtitle="Short videos from your campus community."/>
  {demoVideos.map(v=><View key={v.id} style={s.video}>
   <Text style={{fontSize:64}}>{v.emoji}</Text><Text style={s.creator}>{v.creator}</Text><Text style={s.caption}>{v.caption}</Text><Text style={s.category}>{v.category} · Demo preview</Text>
  </View>)}
  {!session ? <View style={s.guestBox}><Text style={s.guestTitle}>Enjoying CRUSH?</Text><Text style={s.note}>Create an account or sign in when you are ready to comment and access member features.</Text><Pressable accessibilityRole="button" style={s.joinButton} onPress={() => router.push('/(auth)/register')}><Text style={s.joinText}>Create account</Text></Pressable><Pressable accessibilityRole="button" onPress={() => router.push('/(auth)/login')}><Text style={s.loginText}>Already a member? Sign in</Text></Pressable></View> : null}
  <Text style={s.note}>This is a public demo feed. Real community uploads, comments and moderation are still being built.</Text>
 </Screen>;
}
const s=StyleSheet.create({guestBox:{backgroundColor:'#FFF0F6',borderRadius:18,padding:18,gap:10,marginVertical:14},guestTitle:{fontSize:18,fontWeight:'900',color:colors.black},joinButton:{backgroundColor:colors.pink,padding:14,borderRadius:12,alignItems:'center'},joinText:{color:'white',fontWeight:'900'},loginText:{color:colors.pink,fontWeight:'900',textAlign:'center',padding:8},commentButton:{marginTop:10,backgroundColor:'#FFFFFF',padding:10,borderRadius:12},commentText:{color:colors.pink,fontWeight:'900'},video:{height:360,borderRadius:22,backgroundColor:'#271522',alignItems:'center',justifyContent:'center',padding:22,gap:12},creator:{color:'white',fontWeight:'900',fontSize:18},caption:{color:'white',textAlign:'center',fontSize:16},category:{color:'#F7B6D4',fontWeight:'700'},note:{fontSize:11,color:colors.muted}});
