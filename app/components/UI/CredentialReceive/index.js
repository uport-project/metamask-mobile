import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View, Text } from 'react-native';
import { colors, fontStyles } from '../../../styles/common';
import Engine from '../../../core/Engine';
import CredentialAccept from '../CredentialAccept';
// import { strings } from '../../../../locales/i18n';
import DeviceSize from '../../../util/DeviceSize';
import { dataStore } from '../../../daf/setup.ts';
import { Credential } from '@kancha/kancha-ui';

const styles = StyleSheet.create({
	root: {
		backgroundColor: colors.white,
		minHeight: '90%',
		borderTopLeftRadius: 10,
		borderTopRightRadius: 10,
		paddingBottom: DeviceSize.isIphoneX() ? 20 : 0
	},
	informationRow: {
		borderBottomColor: colors.grey200,
		borderBottomWidth: 1,
		padding: 20
	},
	// messageLabelText: {
	// 	...fontStyles.normal,
	// 	margin: 5,
	// 	fontSize: 16
	// },
	// messageText: {
	// 	flex: 1,
	// 	margin: 5,
	// 	fontSize: 14,
	// 	color: colors.fontPrimary,
	// 	...fontStyles.normal
	// },
	title: {
		textAlign: 'center',
		fontSize: 18,
		marginVertical: 12,
		marginHorizontal: 20,
		color: colors.fontPrimary,
		...fontStyles.bold
	}
});

/**
 * PureComponent that supports personal_sign
 */
export default class CredentialReceive extends PureComponent {
	static propTypes = {
		/**
		 * react-navigation object used for switching between screens
		 */
		navigation: PropTypes.object,
		/**
		 * Callback triggered when this message signature is rejected
		 */
		onCancel: PropTypes.func,
		/**
		 * Callback triggered when this message signature is approved
		 */
		onConfirm: PropTypes.func,
		/**
		 * Personal message to be displayed to the user
		 */
		messageParams: PropTypes.object,
		/**
		 * Object containing current page title and url
		 */
		currentPageInformation: PropTypes.object
	};

	state = {
		vc: [],
		loading: true
	};

	signMessage = async () => {
		const { messageParams } = this.props;
		const { DafMessageManager } = Engine.context;
		const messageId = messageParams.metamaskId;
		// const cleanMessageParams = await DafMessageManager.approveMessage(messageParams);
		// const rawSig = await KeyringController.signPersonalMessage(cleanMessageParams);
		DafMessageManager.setMessageStatusSigned(messageId, 'OK');
	};

	rejectMessage = () => {
		const { messageParams } = this.props;
		const { DafMessageManager } = Engine.context;
		const messageId = messageParams.metamaskId;
		DafMessageManager.rejectMessage(messageId);
	};

	cancelSignature = () => {
		this.rejectMessage();
		this.props.onCancel();
	};

	confirmSignature = () => {
		this.signMessage();
		this.props.onConfirm();
	};

	componentDidMount() {
		setTimeout(() => {
			this.getCredentialsFromMessage();

			this.setState({ loading: false });
		}, 300);
	}

	getCredentialsFromMessage = async () => {
		const vcs = await dataStore.credentialsForMessageId(this.props.messageParams.dafmessageId);
		console.log('CREDENTIAL_RECEIVE_VIEW', vcs);
		const vcsWithFields = await Promise.all(
			vcs.map(async vc => ({
				...vc,
				iss: {
					did: vc.iss.did,
					shortId: await dataStore.shortId(vc.iss.did)
				},
				sub: {
					did: vc.sub.did,
					shortId: await dataStore.shortId(vc.iss.did)
				},
				fields: await dataStore.credentialsFieldsForClaimHash(vc.hash)
			}))
		);

		this.setState({
			vc: vcsWithFields
		});
	};

	render() {
		const { currentPageInformation } = this.props;

		return (
			<View style={styles.root}>
				<View style={styles.titleWrapper}>
					<Text style={styles.title} onPress={this.cancelSignature}>
						Credential Received
					</Text>
				</View>

				<CredentialAccept
					credentials={this.state.vc}
					credentialsLoading={this.state.loading}
					navigation={this.props.navigation}
					onCancel={this.cancelSignature}
					onConfirm={this.confirmSignature}
					currentPageInformation={currentPageInformation}
					type="credentialReceive"
				>
					<View style={styles.informationRow}>
						{this.state.vc.map(vc => (
							<Credential
								background={'secondary'}
								key={vc.hash}
								issuer={vc.iss}
								subject={vc.sub}
								fields={vc.fields}
							/>
						))}
					</View>
				</CredentialAccept>
			</View>
		);
	}
}
