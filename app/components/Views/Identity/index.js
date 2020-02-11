import React, { PureComponent } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { getCredentialsNavbarOptions } from '../../UI/Navbar';

import { core } from '../../../daf/setup';

const styles = StyleSheet.create({
	container: {
		padding: 15
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold'
	}
});

class Identity extends PureComponent {
	static navigationOptions = ({ navigation }) => getCredentialsNavbarOptions('credentials.title', navigation);

	state = {
		dids: [],
		addresses: []
	};

	componentDidMount() {
		this.showIdentities();
		this.listIssuers();
	}

	listIssuers = async () => {
		const issuers = await core.identityManager.listIssuers();
		console.log(issuers);
	};

	showIssuer = async () => {
		const issuer = await core.identityManager.issuer('ethr:did:0x6e62b3610d38af8d2130e515ffb9c799a19655c1');

		console.log(issuer);
	};

	showIdentities = async () => {
		const dids = await core.identityManager.listDids();

		this.setState({
			...this.state,
			dids
		});
	};

	render() {
		return (
			<View style={styles.container}>
				<Text style={styles.title}>Metamask identities</Text>
				<Button onPress={this.showIdentities} title={'Show MM identities'} />
				<Button onPress={this.showIssuer} title={'Show Issuer'} />
				{this.state.dids.map(did => (
					<Text key={did}>{did}</Text>
				))}
			</View>
		);
	}
}

export default Identity;
