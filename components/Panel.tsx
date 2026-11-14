import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../constants/theme';
export function Panel({children,style}:{children:React.ReactNode;style?:ViewStyle}) {
 return <View style={[s.panel,style]}>{children}</View>;
}
const s=StyleSheet.create({panel:{backgroundColor:colors.white,borderRadius:20,padding:16,borderWidth:1,borderColor:colors.border,gap:9}});
