'use strict';

const { apiUrl, filled, idempotencyKey } = require('../lib/api');
const samples = require('../lib/samples');

module.exports = {
	key: 'start_enrichment',
	noun: 'Enrichment',
	display: {
		label: 'Start Enrichment',
		description:
			'Starts an Enrichment that normalizes the Captures of a Run or Import into Products, Variants and Offers.',
	},
	operation: {
		inputFields: [
			{
				key: 'source_kind',
				label: 'Source',
				required: true,
				choices: { run: 'Run', import: 'Import' },
				default: 'run',
			},
			{
				key: 'source_id',
				label: 'Source ID',
				required: true,
				helpText: 'The ID of the Run or Import, such as the Run ID from the Run Completed trigger.',
			},
			{
				key: 'budget',
				label: 'Budget',
				type: 'integer',
				helpText: 'The most Captures the Enrichment processes. Leave empty for no limit.',
			},
		],
		perform: async (z, bundle) => {
			const { source_kind, source_id, budget } = bundle.inputData;
			const response = await z.request({
				method: 'POST',
				url: `${apiUrl()}/v1/enrich/enrichments`,
				headers: idempotencyKey(),
				body: {
					source: { kind: source_kind, id: source_id },
					...(filled(budget) ? { budget } : {}),
				},
			});
			return response.data;
		},
		sample: {
			...samples.enrichment,
			triggered_by: 'api',
			status: 'pending',
			finished: false,
			processed: 0,
			duration_ms: null,
			started_at: null,
		},
		outputFields: [
			{ key: 'id', label: 'Enrichment ID' },
			{ key: 'source__kind', label: 'Source Kind' },
			{ key: 'source__id', label: 'Source ID' },
			{ key: 'status', label: 'Status' },
		],
	},
};
