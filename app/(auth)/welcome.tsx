import { router } from 'expo-router';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import { Screen } from '../../components/Screen';
import { colors } from '../../constants/theme';
export default function Welcome() {
 return <Screen style={s.wrap}>
  <View style={s.logo}><Text style={s.heart}>♥</Text></View>
  <Text style={s.brand}>CRUSH</Text>
  <Text style={s.tag}>MEET YOUR PEOPLE. FIND YOUR PERSON.</Text>
  <Text style={s.description}>A campus community for real friendships, meaningful connections and moments worth sharing.</Text>
  <Pressable style={s.primary} onPress={()=>router.push('/(auth)/register')}><Text style={s.primaryText}>Create account</Text></Pressable>
  <Pressable style={s.secondary} onPress={()=>router.push('/(auth)/login')}><Text style={s.secondaryText}>I already have an account</Text></Pressable>
  <Text style={s.legal}>By continuing, you agree to our Terms and Privacy Policy. CRUSH is for adults aged 18 and above.</Text>
 </Screen>;
}
const s=StyleSheet.create({wrap:{flexGrow:1,justifyContent:'center',alignItems:'center',paddingHorizontal:26},logo:{width:92,height:92,borderRadius:30,backgroundColor:colors.blush,alignItems:'center',justifyContent:'center'},heart:{fontSize:54,color:colors.pink},brand:{fontSize:44,fontWeight:'900',letterSpacing:2,color:colors.black,marginTop:15},tag:{fontSize:10,fontWeight:'900',letterSpacing:1.5,color:colors.pink,marginTop:6,textAlign:'center'},description:{fontSize:15,lineHeight:23,textAlign:'center',color:colors.muted,marginVertical:32},primary:{width:'100%',backgroundColor:colors.pink,padding:17,borderRadius:15,alignItems:'center'},primaryText:{color:'white',fontWeight:'900',fontSize:16},secondary:{width:'100%',padding:16,borderRadius:15,borderWidth:1,borderColor:colors.border,alignItems:'center',marginTop:12},secondaryText:{fontWeight:'800',color:colors.black},legal:{fontSize:10,color:colors.muted,textAlign:'center',lineHeight:16,marginTop:26}});
