'use strict';

const { apiUrl, idempotencyKey } = require('../lib/api');
const samples = require('../lib/samples');

module.exports = {
	key: 'create_robot',
	noun: 'Robot',
	display: {
		label: 'Create Robot',
		description:
			'Builds a Robot for an online store. Use the Robot Completed trigger to run it once it is ready.',
	},
	operation: {
		inputFields: [
			{
				key: 'url',
				label: 'Store URL',
				required: true,
				helpText: "The store's home page, such as `https://www.example-store.com`.",
			},
			{
				key: 'country',
				label: 'Country',
				required: true,
				helpText: "The store's market as a two-letter country code, such as `US` or `FR`.",
			},
		],
		perform: async (z, bundle) => {
			const response = await z.request({
				method: 'POST',
				url: `${apiUrl()}/v1/extract/robots`,
				headers: idempotencyKey(),
				body: { url: bundle.inputData.url, country: bundle.inputData.country },
			});
			return response.data;
		},
		sample: { ...samples.robot, status: 'pending', finished: false, run_count: 0 },
		outputFields: [
			{ key: 'id', label: 'Robot ID' },
			{ key: 'name', label: 'Robot Name' },
			{ key: 'host', label: 'Store Host' },
			{ key: 'country', label: 'Country' },
			{ key: 'status', label: 'Status' },
		],
	},
};
