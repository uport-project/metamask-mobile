import { SimpleSigner } from 'did-jwt';

export default class EthrDidMetaMaskMobileController {
	type = 'ethr-did-metamask-mobile';
	Engine;
	SecureKeychain;

	constructor(engine, secureKeyChain) {
		this.Engine = engine;
		this.SecureKeychain = secureKeyChain;

		this.issuerFromIdentity = this.issuerFromIdentity.bind(this);
	}

	async readFromStorage() {
		const { KeyringController } = this.Engine.context;
		const accounts = await KeyringController.getAccounts();
		return {
			identities: accounts.map(account => ({
				did: 'ethr:did:' + account,
				address: account
			}))
		};
	}

	async issuerFromIdentity(identity) {
		const { KeyringController } = this.Engine.context;
		const credentials = await this.SecureKeychain.getGenericPassword();
		const privateKey = await KeyringController.exportAccount(credentials.password, identity.address);
		const issuer = {
			did: identity.did,
			signer: SimpleSigner(privateKey),
			type: this.type,
			ethereumAddress: identity.address
		};
		return issuer;
	}

	async listDids() {
		const { identities } = await this.readFromStorage();
		return identities.map(identity => identity.did);
	}

	async listIssuers() {
		const { identities } = await this.readFromStorage();
		return Promise.all(identities.map(this.issuerFromIdentity));
	}

	async issuer(did) {
		const { identities } = await this.readFromStorage();

		const identity = identities.find(identity => identity.did === did);
		if (!identity) {
			return Promise.reject('Did not found: ' + did);
		}

		return await this.issuerFromIdentity(identity);
	}

	// Metamask handles creating, deleting and exporting identities

	async create() {
		return null;
	}

	async delete() {
		return null;
	}

	async export() {
		return null;
	}
}
