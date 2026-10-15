'use strict';

const zapier = require('zapier-platform-core');

const authentication = require('./authentication');
const { addApiKey, handleErrors } = require('./lib/api');
const eventTriggers = require('./triggers/event');
const robotList = require('./triggers/robot_list');
const runList = require('./triggers/run_list');
const createRobot = require('./creates/create_robot');
const startRun = require('./creates/start_run');
const startEnrichment = require('./creates/start_enrichment');
const runQuery = require('./creates/run_query');

const byKey = (items) => Object.fromEntries(items.map((item) => [item.key, item]));

module.exports = {
	version: require('./package.json').version,
	platformVersion: zapier.version,

	// Empty optional fields reach `perform` as Zapier sends them; the actions skip them with `filled`.
	flags: { cleanInputData: false },

	authentication,
	beforeRequest: [addApiKey],
	afterResponse: [handleErrors],

	triggers: byKey([...eventTriggers, robotList, runList]),
	creates: byKey([createRobot, startRun, startEnrichment, runQuery]),
};
