import React, { PureComponent } from 'react';
import { View, Text, Button } from 'react-native';
import { getCredentialsNavbarOptions } from '../../UI/Navbar';

import { core } from '../../../daf/setup';

class Identity extends PureComponent {
	static navigationOptions = ({ navigation }) => getCredentialsNavbarOptions('credentials.title', navigation);

	state = {
		dids: []
	};

	showIdentities = async () => {
		const dids = await core.identityManager.listDids();

		this.setState({
			dids
		});

		console.log(dids);
	};

	createIdentity = () => {
		core.identityManager.create('rnEthr');

		this.showIdentities();
	};

	componentDidMount() {
		this.showIdentities();
	}

	render() {
		return (
			<View>
				<Button onPress={this.createIdentity} title={'Create Identity'}>
					Create Identity
				</Button>
				{this.state.dids.map(did => (
					<Text key={did}>{did}</Text>
				))}
			</View>
		);
	}
}

export default Identity;
