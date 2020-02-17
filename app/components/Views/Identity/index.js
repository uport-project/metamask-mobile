import React, { PureComponent } from 'react';
import { StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { getCredentialsNavbarOptions } from '../../UI/Navbar';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Credential, ActivityItem, Device, Container, Text, Button } from '@kancha/kancha-ui';
import { core, dataStore } from '../../../daf/setup';
import { colors } from '../../../styles/common';

const styles = StyleSheet.create({
	scrollView: {
		backgroundColor: colors.grey000
	},
	didContainer: {
		textTransform: 'lowercase',
		fontFamily: 'menlo'
	}
});

class Identity extends PureComponent {
	static navigationOptions = ({ navigation }) => getCredentialsNavbarOptions('credentials.title', navigation);

	static propTypes = {
		/**
		 * Object that represents the navigator
		 */
		selectedAddress: PropTypes.string
	};

	state = {
		selectedDid: null,
		activityItems: [],
		activityLoading: false
	};

	componentDidUpdate(prevProps) {
		if (prevProps.selectedAddress !== this.props.selectedAddress) {
			this.getActivity();
		}
	}

	componentDidMount() {
		core.on('validatedMessage', async message => {
			console.log('Parsed Message');

			await dataStore.saveMessage(message);
			this.getActivity();
		});

		this.setState({
			...this.state,
			selectedDid: this.getSelectedDid()
		});

		this.getActivity();
	}

	/**
	 * Sign and save credential with ethereum address private keys
	 * */
	signCredential = async (from, to) => {
		this.setState({
			...this.state,
			loadingCredentials: true
		});

		const jwt = await core.handleAction({
			type: 'action.sign.w3c.vc',
			did: from,
			data: {
				sub: to,
				vc: {
					'@context': ['https://www.w3.org/2018/credentials/v1'],
					type: ['VerifiableCredential'],
					credentialSubject: {
						name: 'Metamask user',
						ethereumAddress: this.props.selectedAddress
					}
				}
			}
		});

		if (jwt) {
			console.log('Sending JWT');

			await core.handleAction({
				type: 'action.sendJwt',
				data: {
					from,
					to,
					jwt
				}
			});
		}
	};

	/**
	 *  This is a bit cumbersome right now.
	 *  We need to add a getCredentialWithFields method in datasstore
	 */
	getCredentialsForMessage = async id => {
		const vcs = await dataStore.credentialsForMessageId(id);
		return await Promise.all(
			vcs.map(async vc => ({
				...vc,
				iss: {
					did: vc.iss.did,
					shortId: await dataStore.shortId(vc.iss.did)
				},
				sub: {
					did: vc.sub.did,
					shortId: await dataStore.shortId(vc.sub.did)
				},
				fields: await dataStore.credentialsFieldsForClaimHash(vc.hash)
			}))
		);
	};

	getSelectedDid = () => `did:ethr:${this.props.selectedAddress}`.toLowerCase();

	getViewer = async () => ({ did: this.getSelectedDid(), shortId: await dataStore.shortId(this.getSelectedDid()) });

	getActivity = async () => {
		const did = this.getSelectedDid();
		const messages = await dataStore.findMessages({
			sender: did,
			receiver: did
		});
		const allItems = await Promise.all(
			messages.map(async message => ({
				...message,
				receiver: {
					did: message.receiver.did,
					shortId: await dataStore.shortId(message.receiver.did)
				},
				sender: {
					did: message.receiver.did,
					shortId: await dataStore.shortId(message.sender.did)
				},
				vc: await this.getCredentialsForMessage(message.id)
			}))
		);

		console.log(allItems);

		this.setState(state => ({
			...state,
			activityItems: allItems
		}));
	};

	noop = () => 'Hello';

	render() {
		const did = this.getSelectedDid();
		return (
			<ScrollView
				style={styles.scrollView}
				refreshControl={<RefreshControl onRefresh={this.getActivity} refreshing={this.state.activityLoading} />}
			>
				<Container background={'primary'} marginBottom={5}>
					<Container padding>
						<Container background={'secondary'} padding={10} br={5} marginVertical={10}>
							<Text selectable textStyle={styles.didContainer}>
								<Text>{did}</Text>
							</Text>
						</Container>
					</Container>
				</Container>
				<Container padding>
					<Button
						fullWidth
						block={'outlined'}
						type={'secondary'}
						buttonText={'Issue Test Credential'}
						onPress={() => this.signCredential(did, did)}
					/>
				</Container>
				{this.state.activityItems.map(item => (
					<ActivityItem
						id={item.id}
						key={item.id}
						profileAction={this.noop}
						confirm={this.noop}
						reject={this.noop}
						viewer={this.getViewer()}
						sender={item.sender}
						attachments={item.vc}
						actions={['Share']}
						renderAttachment={credential => (
							<Container key={credential.hash} w={Device.width - 40} padding paddingRight={0}>
								<Credential
									onPress={this.noop}
									background={'primary'}
									shadow={1.5}
									key={credential.hash}
									issuer={credential.iss}
									subject={credential.sub}
									jwt={credential.jwt}
									fields={credential.fields}
								/>
							</Container>
						)}
						receiver={item.receiver}
						date={item.timestamp * 1000}
						type={item.type}
					/>
				))}
			</ScrollView>
		);
	}
}
const mapStateToProps = state => ({
	identities: state.engine.backgroundState.PreferencesController.identities,
	selectedAddress: state.engine.backgroundState.PreferencesController.selectedAddress
});

export default connect(mapStateToProps)(Identity);
