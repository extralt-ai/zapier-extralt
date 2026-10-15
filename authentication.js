'use strict';

const { apiUrl } = require('./lib/api');

module.exports = {
	type: 'custom',
	fields: [
		{
			key: 'api_key',
			label: 'API Key',
			type: 'password',
			required: true,
			helpText:
				'An organization API key, created in the Extralt dashboard under Settings → Organization → API keys. See [Authentication](https://extralt.com/docs/using-the-api/authentication).',
		},
	],
	// The API has no route naming the organization, so the label tells keys apart by their end.
	connectionLabel: (z, bundle) => `API key ending in ${String(bundle.authData.api_key).slice(-4)}`,
	// Any authenticated read works; the webhook list is small and every key can read it.
	test: async (z) => {
		const response = await z.request({ url: `${apiUrl()}/v1/webhooks` });
		return response.data;
	},
};
