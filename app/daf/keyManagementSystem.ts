import { SimpleSigner } from 'did-jwt';
import { AbstractKeyManagementSystem, AbstractKey, SerializedKey, KeyType } from 'daf-core';

export class Key extends AbstractKey {
  constructor(public serialized: SerializedKey) {
    super()
  }

  async encrypt(to: SerializedKey, data: string) {
    return Promise.reject('Not implemented')
  }

  async decrypt(encrypted: string) {
    return Promise.reject('Not implemented')
  }

  signer() {
    if (!this.serialized.privateKeyHex) throw Error('No private key')
    return SimpleSigner(this.serialized.privateKeyHex)
  }

  signEthTransaction(transaction: object, callback: (error: string | null, signature: string) => void) {
    return Promise.reject('Not implemented')
  }
}


export default class MetamaskKeyManagementSystem extends AbstractKeyManagementSystem {

	constructor(private engine, private secureKeyChain) {
		super()
	}

  async createKey(type: KeyType): Promise<AbstractKey> {
		return Promise.reject('Not implemented')
  }

  async getKey(kid: string) {
		const { KeyringController } = this.engine.context;
		const credentials = await this.secureKeyChain.getGenericPassword();
		const privateKey = await KeyringController.exportAccount(credentials.password, kid);

		const serializedKey: SerializedKey = {
			type: 'Secp256k1',
			kid,
			publicKeyHex: kid,
			privateKeyHex: privateKey
		}

		return new Key(serializedKey)
  }

  async deleteKey(kid: string) {
    return Promise.reject('Not implemented')
  }
}
