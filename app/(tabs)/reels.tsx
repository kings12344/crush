import { Text, View, StyleSheet } from 'react-native';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { demoVideos } from '../../data/demo';
import { colors } from '../../constants/theme';
export default function Reels() {
 return <Screen>
  <Heading eyebrow="CRUSH SOCIAL" title="Reels" subtitle="Short videos from your campus community."/>
  {demoVideos.map(v=><View key={v.id} style={s.video}>
   <Text style={{fontSize:64}}>{v.emoji}</Text><Text style={s.creator}>{v.creator}</Text><Text style={s.caption}>{v.caption}</Text><Text style={s.category}>{v.category} · Demo preview</Text>
  </View>)}
  <Text style={s.note}>Video upload, streaming, moderation and swipe feed are planned integrations—not active in this starter.</Text>
 </Screen>;
}
const s=StyleSheet.create({video:{height:360,borderRadius:22,backgroundColor:'#271522',alignItems:'center',justifyContent:'center',padding:22,gap:12},creator:{color:'white',fontWeight:'900',fontSize:18},caption:{color:'white',textAlign:'center',fontSize:16},category:{color:'#F7B6D4',fontWeight:'700'},note:{fontSize:11,color:colors.muted}});
