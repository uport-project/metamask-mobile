import { Core, Message as DafMessage } from 'daf-core';
import { MessageValidator as DidJwtMessageValidator } from 'daf-did-jwt';
import { MessageValidator as W3cMessageValidator, ActionHandler as W3cActionHandler } from 'daf-w3c';
import { MessageValidator as SDMessageValidator, ActionHandler as SDActionHandler } from 'daf-selective-disclosure';
import { MessageValidator as UrlMessageValidator } from 'daf-url';
import { ActionHandler as DBGActionHandler, MessageValidator as DBGMessageValidator } from 'daf-debug';
import { ActionHandler as TGActionHandler, ServiceController as TGServiceController } from 'daf-trust-graph';
import { Resolver } from 'did-resolver';
import { getResolver as ethrDidResolver } from 'ethr-did-resolver';
import { getResolver as webDidResolver } from 'web-did-resolver';
import { IdentityProvider } from 'daf-ethr-did'
import IdentityStore from './identityStore';
import KeyManagementSystem from './keyManagementSystem';
import Engine from '../core/Engine';
import SecureKeychain from '../core/SecureKeychain';
import RnSqlite from 'daf-react-native-sqlite3';
import { DataStore } from 'daf-data-store';
import Debug from 'debug';
Debug.enable('*')

const infuraProjectId = '5ffc47f65c4042ce847ef66a3fa70d4c'


const identityProviders = [new IdentityProvider({
	identityStore: new IdentityStore(Engine, SecureKeychain),
	kms: new KeyManagementSystem(Engine, SecureKeychain),
	network: 'rinkeby',
	rpcUrl: 'https://rinkeby.infura.io/v3/' + infuraProjectId,
})];

const web = webDidResolver();
const didResolver = new Resolver({
	...ethrDidResolver({
		networks: [
			{ name: 'mainnet', rpcUrl: 'https://mainnet.infura.io/v3/' + infuraProjectId },
			{ name: 'rinkeby', rpcUrl: 'https://rinkeby.infura.io/v3/' + infuraProjectId },
	]}),
	...web,
	https: web.web
});

const messageValidator = new DBGMessageValidator();
messageValidator
	.setNext(new UrlMessageValidator())
	.setNext(new DidJwtMessageValidator())
	.setNext(new W3cMessageValidator())
	.setNext(new SDMessageValidator());

const actionHandler = new DBGActionHandler();
actionHandler
	.setNext(new TGActionHandler())
	.setNext(new W3cActionHandler())
	.setNext(new SDActionHandler());

const serviceControllers = [TGServiceController];

export const core = new Core({
	identityProviders,
	serviceControllers,
	didResolver,
	messageValidator,
	actionHandler
});

export const db = new RnSqlite('database.sqlite3');
export const dataStore = new DataStore(db);

export { DafMessage };
