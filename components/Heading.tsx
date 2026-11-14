import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';
export function Heading({eyebrow,title,subtitle}:{eyebrow?:string;title:string;subtitle?:string}) {
 return <View style={{gap:5}}>
  {eyebrow ? <Text style={s.eyebrow}>{eyebrow.toUpperCase()}</Text>:null}
  <Text style={s.title}>{title}</Text>
  {subtitle ? <Text style={s.subtitle}>{subtitle}</Text>:null}
 </View>;
}
const s=StyleSheet.create({eyebrow:{color:colors.pink,fontWeight:'800',fontSize:11,letterSpacing:1.4},title:{fontSize:29,fontWeight:'900',color:colors.black},subtitle:{fontSize:14,color:colors.muted,lineHeight:21}});
