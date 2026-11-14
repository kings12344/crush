import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../constants/theme';
export function Screen({children,style}:{children:React.ReactNode;style?:ViewStyle}) {
 return <ScrollView style={styles.root} contentContainerStyle={[styles.content,style]}>{children}<View style={{height:24}}/></ScrollView>;
}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:colors.background},content:{padding:18,gap:14}});
