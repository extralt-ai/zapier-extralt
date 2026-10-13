'use strict';

/**
 * The event types an endpoint can subscribe to, as the Extralt API names them,
 * with what the Zap editor needs to describe them. `list` is the API route
 * that supplies real samples and `statuses` the resource statuses that match
 * the event; Imports have no list route, so their samples are static.
 */
const EVENTS = [
	{
		type: 'robot.completed',
		resource: 'robot',
		label: 'Robot Completed',
		description: 'Triggers when a Robot finishes building and can run.',
		list: '/v1/extract/robots',
		statuses: ['completed'],
	},
	{
		type: 'robot.failed',
		resource: 'robot',
		label: 'Robot Failed',
		description: 'Triggers when a Robot build fails.',
		list: '/v1/extract/robots',
		statuses: ['failed'],
	},
	{
		type: 'run.completed',
		resource: 'run',
		label: 'Run Completed',
		description: 'Triggers when a Run finishes extracting its Captures.',
		list: '/v1/extract/runs',
		statuses: ['completed'],
	},
	{
		type: 'run.stopped',
		resource: 'run',
		label: 'Run Stopped',
		description: 'Triggers when a Run is stopped before it finishes.',
		list: '/v1/extract/runs',
		statuses: ['stopped'],
	},
	{
		type: 'run.failed',
		resource: 'run',
		label: 'Run Failed',
		description: 'Triggers when a Run fails.',
		list: '/v1/extract/runs',
		statuses: ['failed'],
	},
	{
		type: 'run.enrichment_skipped',
		resource: 'run',
		label: 'Run Enrichment Skipped',
		description: 'Triggers when a Run completes but its automatic Enrichment could not start.',
		list: '/v1/extract/runs',
		statuses: ['completed'],
	},
	{
		type: 'enrichment.completed',
		resource: 'enrichment',
		label: 'Enrichment Completed',
		description: 'Triggers when an Enrichment has normalized every Capture of its Run or Import.',
		list: '/v1/enrich/enrichments',
		statuses: ['completed'],
	},
	{
		type: 'enrichment.stopped',
		resource: 'enrichment',
		label: 'Enrichment Stopped',
		description: 'Triggers when an Enrichment is stopped before it finishes.',
		list: '/v1/enrich/enrichments',
		statuses: ['stopped'],
	},
	{
		type: 'enrichment.failed',
		resource: 'enrichment',
		label: 'Enrichment Failed',
		description: 'Triggers when an Enrichment fails.',
		list: '/v1/enrich/enrichments',
		statuses: ['failed'],
	},
	{
		type: 'import.completed',
		resource: 'import',
		label: 'Import Completed',
		description: 'Triggers when a catalog file has been turned into Captures.',
		statuses: ['completed'],
	},
	{
		type: 'import.failed',
		resource: 'import',
		label: 'Import Failed',
		description: 'Triggers when a catalog file could not be imported.',
		statuses: ['failed'],
	},
];

module.exports = { EVENTS };
