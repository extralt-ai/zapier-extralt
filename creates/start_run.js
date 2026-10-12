'use strict';

const { apiUrl, filled, idempotencyKey } = require('../lib/api');
const samples = require('../lib/samples');

module.exports = {
	key: 'start_run',
	noun: 'Run',
	display: {
		label: 'Start Run',
		description: "Starts a Run of a Robot to extract a store's current catalog.",
	},
	operation: {
		inputFields: [
			{
				key: 'robot_id',
				label: 'Robot',
				required: true,
				dynamic: 'robot_list.id.label',
				helpText:
					'The Robot to run. Build one first with the Create Robot action or in the dashboard.',
			},
			{
				key: 'start_urls',
				label: 'Start URLs',
				list: true,
				helpText:
					"Pages to start from, such as a category, instead of the whole store. They must be on the Robot's store.",
			},
			{
				key: 'budget',
				label: 'Budget',
				type: 'integer',
				helpText: 'The most Captures the Run extracts. Leave empty for no limit.',
			},
			{
				key: 'auto_enrich',
				label: 'Enrich Automatically',
				type: 'boolean',
				helpText:
					'Start an Enrichment of the Captures when the Run completes. Leave empty for the default.',
			},
		],
		perform: async (z, bundle) => {
			const { robot_id, start_urls, budget, auto_enrich } = bundle.inputData;
			const response = await z.request({
				method: 'POST',
				url: `${apiUrl()}/v1/extract/runs`,
				headers: idempotencyKey(),
				body: {
					robot_id,
					...(start_urls && start_urls.length > 0 ? { start_urls } : {}),
					...(filled(budget) ? { budget } : {}),
					...(filled(auto_enrich) ? { auto_enrich } : {}),
				},
			});
			return response.data;
		},
		sample: { ...samples.run, status: 'pending', finished: false, extracted: 0, started_at: null },
		outputFields: [
			{ key: 'id', label: 'Run ID' },
			{ key: 'name', label: 'Run Name' },
			{ key: 'robot_id', label: 'Robot ID' },
			{ key: 'robot_name', label: 'Robot Name' },
			{ key: 'status', label: 'Status' },
		],
	},
};
