import { Text } from 'react-native';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Panel } from '../../components/Panel';
export default function Inbox() {
 return <Screen><Heading eyebrow="YOUR CONVERSATIONS" title="Inbox" subtitle="Private conversations with your matches."/>
 <Panel><Text style={{fontSize:34}}>💬</Text><Text style={{fontSize:17,fontWeight:'900'}}>No conversations yet</Text><Text style={{color:'#77717A',lineHeight:21}}>When you make an eligible mutual match, your conversations will appear here.</Text></Panel></Screen>;
}
