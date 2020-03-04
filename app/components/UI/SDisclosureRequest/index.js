import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View, Text } from 'react-native';
import { colors, fontStyles } from '../../../styles/common';
import Engine from '../../../core/Engine';
import VPSign from '../VPSign';
// import { strings } from '../../../../locales/i18n';
// import { util } from 'gaba';
import DeviceSize from '../../../util/DeviceSize';
import { getRequestedClaims } from '../../../daf/getRequestClaims.ts';
import { dataStore, core } from '../../../daf/setup.ts';
import { RequestItem, Container } from '@kancha/kancha-ui';

const styles = StyleSheet.create({
	root: {
		backgroundColor: colors.white,
		minHeight: '90%',
		borderTopLeftRadius: 10,
		borderTopRightRadius: 10,
		paddingBottom: DeviceSize.isIphoneX() ? 20 : 0
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
export default class SDisclosureRequest extends PureComponent {
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
		sdr: []
	};

	async componentDidMount() {
		setTimeout(async () => {
			const sdr = await this.getSDRFrommessage();
			let valid = true;
			if (sdr[0].vc.length === 0) {
				valid = false;
			}
			this.setState({ loading: false, sdr, valid });
		}, 300);
	}

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

	getSDRFrommessage = async () => {
		const { PreferencesController } = Engine.context;
		const selectedAddress = PreferencesController.internalState.selectedAddress;
		const identity = await core.identityManager.getIdentity(`did:ethr:rinkeby:${selectedAddress}`.toLowerCase());
		const msg = await dataStore.findMessage(this.props.messageParams.dafmessageId);
		return await getRequestedClaims(msg, identity);
	};

	noop = () => 'Hey!';

	render() {
		const { messageParams, currentPageInformation } = this.props;

		console.log(messageParams);

		return (
			<View style={styles.root}>
				<View style={styles.titleWrapper}>
					<Text style={styles.title} onPress={this.cancelSignature}>
						Share Credentials
					</Text>
				</View>

				<VPSign
					disabled={!this.state.valid}
					navigation={this.props.navigation}
					onCancel={this.cancelSignature}
					onConfirm={this.confirmSignature}
					currentPageInformation={currentPageInformation}
					type="credentialRequest"
				>
					<Container>
						{this.state.sdr.map((sdr, index) => (
							<RequestItem
								key={index}
								onSelectItem={this.noop}
								reason={sdr.reason}
								credentials={sdr.vc}
								claimType={sdr.claimType}
								required={sdr.essential}
								issuers={sdr.issuers}
							/>
						))}
					</Container>
				</VPSign>
			</View>
		);
	}
}
