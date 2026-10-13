'use strict';

const { apiUrl } = require('../lib/api');

module.exports = {
	key: 'run_query',
	noun: 'Query',
	display: {
		label: 'Run Query',
		description:
			"Runs read-only SQL over the organization's Captures, Items and Explore tables and returns the rows as line items.",
	},
	operation: {
		inputFields: [
			{
				key: 'sql',
				label: 'SQL',
				type: 'text',
				required: true,
				helpText:
					'One ClickHouse `SELECT` or `WITH` query, with a `LIMIT`. See [SQL queries](https://extralt.com/docs/using-the-api/sql-queries) for the tables and columns.',
			},
		],
		perform: async (z, bundle) => {
			const response = await z.request({
				method: 'POST',
				url: `${apiUrl()}/v1/query`,
				body: { sql: bundle.inputData.sql },
			});
			// `rows` are line items: a later step can create one record per row.
			return response.data;
		},
		sample: {
			count: 2,
			truncated: false,
			rows: [
				{ currency: 'USD', offers: '1250' },
				{ currency: 'EUR', offers: '310' },
			],
		},
		outputFields: [
			{ key: 'count', label: 'Row Count', type: 'integer' },
			{ key: 'truncated', label: 'Truncated', type: 'boolean' },
		],
	},
};
