import { validateSignMessageData, normalizeMessageData } from '../../node_modules/gaba/dist/util';
import AbstractMessageManager, {
	AbstractMessage,
	AbstractMessageParams,
	AbstractMessageParamsMetamask,
	OriginalRequest
} from '../../node_modules/gaba/dist/message-manager/AbstractMessageManager';
import Logger from '../util/Logger';
const random = require('uuid/v1');

import { core, DafMessage, dataStore } from './setup';
import {getRequestedClaims} from './getRequestClaims'
import Engine from '../core/Engine'

const saveDafMessage = async () => {};

/**
 * @type Message
 *
 * Represents and contains data about a 'eth_sign' type signature request.
 * These are created when a signature for an eth_sign call is requested.
 *
 * @property id - An id to track and identify the message object
 * @property messageParams - The parameters to pass to the eth_sign method once the signature request is approved
 * @property type - The json-prc signing method for which a signature request has been made.
 * A 'Message' which always has a 'eth_sign' type
 * @property rawSig - Raw data of the signature request
 */
export interface Message extends AbstractMessage {
	messageParams: MessageParams;
}

/**
 * @type PersonalMessageParams
 *
 * Represents the parameters to pass to the eth_sign method once the signature request is approved.
 *
 * @property data - A hex string conversion of the raw buffer data of the signature request
 * @property from - Address to sign this message from
 * @property origin? - Added for request origin identification
 */
export interface MessageParams extends AbstractMessageParams {
	data: string;
}

/**
 * @type MessageParamsMetamask
 *
 * Represents the parameters to pass to the eth_sign method once the signature request is approved
 * plus data added by MetaMask.
 *
 * @property metamaskId - Added for tracking and identification within MetaMask
 * @property data - A hex string conversion of the raw buffer data of the signature request
 * @property from - Address to sign this message from
 * @property origin? - Added for request origin identification
 */
export interface MessageParamsMetamask extends AbstractMessageParamsMetamask {
	data: string;
}

/**
 * Controller in charge of managing - storing, adding, removing, updating - Messages.
 */
export class DafMessageManager extends AbstractMessageManager<Message, MessageParams, MessageParamsMetamask> {
	/**
	 * Name of this controller used during composition
	 */
	name = 'DafMessageManager';

	/**
	 * Creates a new Message with an 'unapproved' status using the passed messageParams.
	 * this.addMessage is called to add the new Message to this.messages, and to save the unapproved Messages.
	 *
	 * @param messageParams - The params for the eth_sign call to be made after the message is approved
	 * @param req? - The original request object possibly containing the origin
	 * @returns - Promise resolving to the raw data of the signature request
	 */
	addUnapprovedCredentialAsync(messageParams: MessageParams, req?: OriginalRequest): Promise<string> {
		return new Promise(async (resolve, reject) => {
			const messageId = await this.addUnapprovedMessage(messageParams, req);
			this.hub.once(`${messageId}:finished`, async (data: Message) => {
				switch (data.status) {
					case 'signed':
						return resolve('OK');
					case 'rejected':
						return reject(new Error('MetaMask Credential Receive: User denied credential.'));
					default:
						return reject(
							new Error(`MetaMask Message Signature: Unknown problem: ${JSON.stringify(messageParams)}`)
						);
				}
			});
		});
	}

	/**
	 * Creates a new Message with an 'unapproved' status using the passed messageParams.
	 * this.addMessage is called to add the new Message to this.messages, and to save the unapproved Messages.
	 *
	 * @param messageParams - The params for the eth_sign call to be made after the message is approved
	 * @param req? - The original request object possibly containing the origin
	 * @returns - Promise resolving to the raw data of the signature request
	 */
	addUnapprovedSDRAsync(messageParams: MessageParams, req?: OriginalRequest): Promise<string> {

		const signVp = async (dafMessageId:string) => {
			const { PreferencesController } = Engine.context;
			const selectedAddress = PreferencesController.internalState.selectedAddress
			const identity = await core.identityManager.getIdentity(`did:ethr:rinkeby:${selectedAddress}`.toLowerCase())
			const msg = await dataStore.findMessage(dafMessageId)
			const sdr = await getRequestedClaims(msg, identity);
			const firstCredential = sdr && sdr[0]?.vc[0]?.jwt

			console.log('MESSAGE_SENDER',msg)

			if (firstCredential) {
				console.log('SIGN VP')

				const jwt = await core.handleAction({
					type: 'action.sign.w3c.vp',
					// @ts-ignore
					did: identity.did,
					data: {					
					  aud: msg.sender.did,
					  tag: msg.threadId,
					  vp: {
						'@context': ['https://www.w3.org/2018/credentials/v1'],
						type: ['VerifiablePresentation'],
						verifiableCredential: [firstCredential],
					  },
					},
				  })
				
				await core.validateMessage(new DafMessage({raw:jwt, meta: {type: 'walletConnect'}}))
			
				return jwt
			}

		}

		return new Promise(async (resolve, reject) => {
			const { messageId, dafmessageId }= await this.addUnapprovedSDRRequest(messageParams, req);
			
			this.hub.once(`${messageId}:finished`, async (data: Message) => {
				switch (data.status) {
					case 'signed':
						const vpJwt = await signVp(dafmessageId)
						Logger.log('Resolved JWT', vpJwt)
						return resolve(vpJwt);
					case 'rejected':
						return reject(new Error('MetaMask Credential Share: User denied sharing credentials.'));
					default:
						return reject(
							new Error(`MetaMask Credential Share: Unknown problem: ${JSON.stringify(messageParams)}`)
						);
				}
			});
		});
	}

	/**
	 * Creates a new Message with an 'unapproved' status using the passed messageParams.
	 * this.addMessage is called to add the new Message to this.messages, and to save the
	 * unapproved Messages.
	 *
	 * @param messageParams - The params for the eth_sign call to be made after the message
	 * is approved
	 * @param req? - The original request object possibly containing the origin
	 * @returns - The id of the newly created message
	 */
		async addUnapprovedMessage(messageParams: MessageParams, req?: OriginalRequest) {
		if (req) {
			messageParams.origin = req.origin;
		}
		// messageParams.data = normalizeMessageData(messageParams.data);
		const dafmessage = await core.validateMessage(
			new DafMessage({
				raw: messageParams.data,
				meta: {
					type: 'walletConnect'
				}
			})
		);
		const messageId = random();
		const messageData: Message = {
			id: messageId,
			messageParams,
			status: 'unapproved',
			time: Date.now(),
			type: 'issue_credential'
		};
		this.addMessage(messageData);
		Logger.log('Message_DATA', messageData);
		this.hub.emit(`unapprovedCredential`, { ...messageParams, ...{ dafmessageId: dafmessage.id }, ...{ metamaskId: messageId } });

		return messageId
	}

	/**
	 * Creates a new Message with an 'unapproved' status using the passed messageParams.
	 * this.addMessage is called to add the new Message to this.messages, and to save the
	 * unapproved Messages.
	 *
	 * @param messageParams - The params for the eth_sign call to be made after the message
	 * is approved
	 * @param req? - The original request object possibly containing the origin
	 * @returns - The id of the newly created message
	 */
	async addUnapprovedSDRRequest(messageParams: MessageParams, req?: OriginalRequest) {
		if (req) {
			messageParams.origin = req.origin;
		}
		const dafmessage = await core.validateMessage(
			new DafMessage({
				raw: messageParams.data,
				meta: {
					type: 'walletConnect'
				}
			})
		);
		const messageId = random();
		const messageData: Message = {
			id: messageId,
			messageParams,
			status: 'unapproved',
			time: Date.now(),
			type: 'request_credentials'
		};
		this.addMessage(messageData);
		Logger.log('Message_DATA', messageData);
		this.hub.emit(`unapprovedSDR_Request`, { ...messageParams, ...{ dafmessageId: dafmessage.id }, ...{ metamaskId: messageId } });
		return {messageId, dafmessageId:dafmessage.id}
	}

	/**
	 * Removes the metamaskId property from passed messageParams and returns a promise which
	 * resolves the updated messageParams
	 *
	 * @param messageParams - The messageParams to modify
	 * @returns - Promise resolving to the messageParams with the metamaskId property removed
	 */
	prepMessageForSigning(messageParams: MessageParamsMetamask): Promise<MessageParams> {
		delete messageParams.metamaskId;
		return Promise.resolve(messageParams);
	}

	
}

export default DafMessageManager;
