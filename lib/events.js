'use strict';

/** Whether an Enrichment found at least one change, as `enrichment.changes` requires. */
const foundChanges = (enrichment) =>
	Boolean(enrichment.changes) && Object.values(enrichment.changes).some((count) => count > 0);

/**
 * The event types an endpoint can subscribe to, as the Extralt API names them,
 * with what the Zap editor needs to describe them. `list` is the API route
 * that supplies real samples and `statuses` the resource statuses that match
 * the event; Imports have no list route, so their samples are static.
 * `matches` narrows real samples further, and `sample` overrides fields of the
 * static one, for events that depend on more than a status. `fields` labels
 * output fields beyond the resource's own.
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
		type: 'enrichment.changes',
		resource: 'enrichment',
		label: 'Enrichment Changes Found',
		description:
			'Triggers once per Enrichment that found price, stock or Listing changes, with a count of each kind.',
		list: '/v1/enrich/enrichments',
		statuses: ['completed', 'stopped', 'failed'],
		matches: foundChanges,
		sample: {
			changes: {
				price_decreases: 12,
				price_increases: 3,
				out_of_stock: 1,
				restocked: 0,
				listings_added: 0,
				listings_removed: 2,
				new_lows: 4,
			},
		},
		fields: [
			['changes__price_decreases', 'Price Decreases', 'integer'],
			['changes__price_increases', 'Price Increases', 'integer'],
			['changes__out_of_stock', 'Out of Stock', 'integer'],
			['changes__restocked', 'Restocked', 'integer'],
			['changes__listings_added', 'Listings Added', 'integer'],
			['changes__listings_removed', 'Listings Removed', 'integer'],
			['changes__new_lows', 'New Lows', 'integer'],
		],
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
