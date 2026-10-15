'use strict';

const { apiUrl } = require('../lib/api');
const samples = require('../lib/samples');

const PAGE_SIZE = 100;

/** Supplies the Robot dropdown of the Start Run action; hidden from the trigger list. */
module.exports = {
	key: 'robot_list',
	noun: 'Robot',
	display: {
		label: 'List Robots',
		description: 'Lists the Robots of the organization.',
		hidden: true,
	},
	operation: {
		canPaginate: true,
		perform: async (z, bundle) => {
			// Zapier asks for page 0, then 1, 2… as the user scrolls; the API pages by cursor.
			const cursor = bundle.meta.page ? await z.cursor.get() : undefined;
			// A later page without a stored cursor means the previous one was the last.
			if (bundle.meta.page && !cursor) return [];
			const response = await z.request({
				url: `${apiUrl()}/v1/extract/robots`,
				params: { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) },
			});
			await z.cursor.set(response.data.next_cursor || '');
			return response.data.data.map((robot) => ({
				...robot,
				label: `${robot.name} (${robot.host})`,
			}));
		},
		sample: { ...samples.robot, label: `${samples.robot.name} (${samples.robot.host})` },
		outputFields: [
			{ key: 'id', label: 'Robot ID' },
			{ key: 'name', label: 'Robot Name' },
			{ key: 'host', label: 'Store Host' },
		],
	},
};
