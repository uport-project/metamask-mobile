import { Core } from 'daf-core';
import { MessageValidator as DidJwtMessageValidator } from 'daf-did-jwt';
import { MessageValidator as W3cMessageValidator, ActionHandler as W3cActionHandler } from 'daf-w3c';
import { MessageValidator as SDMessageValidator, ActionHandler as SDActionHandler } from 'daf-selective-disclosure';
import { MessageValidator as UrlMessageValidator } from 'daf-url';
import { ActionHandler as DBGActionHandler, MessageValidator as DBGMessageValidator } from 'daf-debug';

import { Resolver } from 'did-resolver';
import { getResolver as ethrDidResolver } from 'ethr-did-resolver';
import { getResolver as webDidResolver } from 'web-did-resolver';
import EthrDidMetaMaskMobileController from './identityController';

import Engine from '../core/Engine';
import SecureKeychain from '../core/SecureKeychain';

import RnSqlite from 'daf-react-native-sqlite3';
import { DataStore } from 'daf-data-store';

const web = webDidResolver();
const didResolver = new Resolver({
	...ethrDidResolver({
		rpcUrl: 'https://mainnet.infura.io/v3/5ffc47f65c4042ce847ef66a3fa70d4c'
	}),
	...web,
	https: web.web
});

const identityControllers = [new EthrDidMetaMaskMobileController(Engine, SecureKeychain)];

const messageValidator = new DBGMessageValidator();
messageValidator
	.setNext(new UrlMessageValidator())
	.setNext(new DidJwtMessageValidator())
	.setNext(new W3cMessageValidator())
	.setNext(new SDMessageValidator());

const actionHandler = new DBGActionHandler();
actionHandler.setNext(new W3cActionHandler()).setNext(new SDActionHandler());

const serviceControllers = [];

export const core = new Core({
	identityControllers,
	serviceControllers,
	didResolver,
	messageValidator,
	actionHandler
});

export const db = new RnSqlite('database.sqlite3');
export const dataStore = new DataStore(db);
