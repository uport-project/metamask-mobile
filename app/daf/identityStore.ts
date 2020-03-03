import { AbstractIdentityStore, SerializedIdentity } from 'daf-core';

export interface SerializedMetamaskIdentity extends SerializedIdentity {
	address: string;
}

export default class MetamaskIdentityStore extends AbstractIdentityStore {
	constructor(private engine, private secureKeyChain) {
		super();
	}

	async get(did: string): Promise<SerializedIdentity> {
		const { KeyringController } = this.engine.context;
		const accounts = await KeyringController.getAccounts();
		const account = accounts.find(item => this.accountToDid(item) === did);
		return {
			did,
			controllerKeyId: account,
			keys: [
				{
					type: 'Secp256k1',
					kid: account,
					publicKeyHex: account // FIX this
				}
			]
		};
	}

	async delete(did: string) {
		return Promise.reject('Not implemented');
	}

	async set(did: string, serializedIdentity: SerializedMetamaskIdentity) {
		return Promise.reject('Not implemented');
	}

	async listDids() {
		const { KeyringController } = this.engine.context;
		const accounts = await KeyringController.getAccounts();
		return accounts.map(account => this.accountToDid(account));
	}

	private accountToDid(account: string) {
		return 'did:ethr:rinkeby:' + account;
	}
}
