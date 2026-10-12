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
	// Any authenticated read works; the webhook list is small and every key can read it.
	test: async (z) => {
		const response = await z.request({ url: `${apiUrl()}/v1/webhooks` });
		return response.data;
	},
};
