import { Text } from 'react-native';
import { Screen } from '../../components/Screen';
import { Heading } from '../../components/Heading';
import { Panel } from '../../components/Panel';
export default function Matches() {
 return <Screen><Heading eyebrow="MUTUAL CONNECTIONS" title="Matches" subtitle="Your mutual connections will appear here."/>
 <Panel><Text style={{fontSize:36}}>💗</Text><Text style={{fontSize:17,fontWeight:'900'}}>Your story starts with a mutual like.</Text><Text style={{color:'#77717A',lineHeight:21}}>Secret Crush identities stay private unless both people express interest. Matching will be connected to the backend.</Text></Panel></Screen>;
}
