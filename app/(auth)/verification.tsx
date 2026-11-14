import { useState } from 'react';
import { Alert, Pressable, Text, StyleSheet } from 'react-native';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Panel } from '../../components/Panel';
import { colors } from '../../constants/theme';
export default function Verification() {
 const [method,setMethod]=useState('University email');
 return <Screen>
  <Heading eyebrow="STUDENT COMMUNITY" title="Verify your student status" subtitle="Verification helps keep CRUSH focused on genuine students. Your documents are never public."/>
  {['University email','Student card review','Manual verification'].map(m=><Pressable key={m} onPress={()=>setMethod(m)}><Panel style={method===m?{borderColor:colors.pink,borderWidth:2}:undefined}><Text style={{fontWeight:'900',color:colors.black}}>{method===m?'◉':'○'}  {m}</Text><Text style={{color:colors.muted,fontSize:12}}>{m==='University email'?'Use an eligible institution email address.':m==='Student card review'?'Submit a secure document for authorized review.':'Request help if other methods are unavailable.'}</Text></Panel></Pressable>)}
  <Panel><Text style={{fontWeight:'900'}}>Privacy promise</Text><Text style={{color:colors.muted,lineHeight:20}}>Verification files are private and must only be accessible to authorized verification staff. This demo does not upload or store documents.</Text></Panel>
  <Pressable style={s.button} onPress={()=>Alert.alert('Verification not connected','This is a design preview. Secure upload, review and university email verification will be implemented with the backend.')}><Text style={s.buttonText}>Continue with {method}</Text></Pressable>
 </Screen>;
}
const s=StyleSheet.create({button:{backgroundColor:colors.pink,padding:16,borderRadius:14,alignItems:'center'},buttonText:{color:'white',fontWeight:'900'}});
