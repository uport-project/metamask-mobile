import React, { PureComponent } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';

import { store, persistor } from '../../../store/';
import { core, dataStore, db } from '../../../daf/setup';

import App from '../../Nav/App';
import SecureKeychain from '../../../core/SecureKeychain';

/**
 * Top level of the component hierarchy
 * App component is wrapped by the provider from react-redux
 */
export default class Root extends PureComponent {
	constructor(props) {
		super(props);
		SecureKeychain.init(props.foxCode); // eslint-disable-line
	}

	componentDidMount() {
		const syncDaf = async () => {
			await db.initialize();
			await dataStore.initialize();
			await core.setupServices();
			await core.listen();

			await core.getMessagesSince(await dataStore.latestMessageTimestamps());
		};

		syncDaf();
	}

	render = () => (
		<Provider store={store}>
			<PersistGate persistor={persistor}>
				<App />
			</PersistGate>
		</Provider>
	);
}
