'use strict';

const { apiUrl } = require('../lib/api');
const samples = require('../lib/samples');

const PAGE_SIZE = 100;

/** Supplies the Run dropdown of the Start Enrichment action; hidden from the trigger list. */
module.exports = {
	key: 'run_list',
	noun: 'Run',
	display: {
		label: 'List Runs',
		description: 'Lists the Runs of the organization.',
		hidden: true,
	},
	operation: {
		canPaginate: true,
		perform: async (z, bundle) => {
			// Zapier asks for page 0, then 1, 2… as the user scrolls; the API pages by cursor.
			const cursor = bundle.meta.page ? await z.cursor.get() : undefined;
			const response = await z.request({
				url: `${apiUrl()}/v1/extract/runs`,
				params: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
			});
			await z.cursor.set(response.data.next_cursor || '');
			return response.data.data.map((run) => ({ ...run, label: `${run.name} (${run.status})` }));
		},
		sample: { ...samples.run, label: `${samples.run.name} (${samples.run.status})` },
		outputFields: [
			{ key: 'id', label: 'Run ID' },
			{ key: 'name', label: 'Run Name' },
			{ key: 'status', label: 'Status' },
		],
	},
};
