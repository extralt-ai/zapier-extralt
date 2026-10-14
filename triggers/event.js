'use strict';

const { apiUrl, idempotencyKey } = require('../lib/api');
const { EVENTS } = require('../lib/events');
const samples = require('../lib/samples');
const { verifySignature } = require('../lib/signature');

const SAMPLE_PAGE_SIZE = 25;
const MAX_DESCRIPTION_LENGTH = 200;

const NOUNS = { robot: 'Robot', run: 'Run', enrichment: 'Enrichment', import: 'Import' };

/** Labels for the fields people map most, flattened the way Zapier names them. */
const RESOURCE_FIELDS = {
	robot: [
		['id', 'Robot ID'],
		['name', 'Robot Name'],
		['host', 'Store Host'],
		['country', 'Country'],
		['status', 'Status'],
		['status_reason', 'Status Reason'],
		['run_count', 'Run Count', 'integer'],
	],
	run: [
		['id', 'Run ID'],
		['name', 'Run Name'],
		['robot_id', 'Robot ID'],
		['robot_name', 'Robot Name'],
		['status', 'Status'],
		['status_reason', 'Status Reason'],
		['triggered_by', 'Triggered By'],
		['extracted', 'Captures Extracted', 'integer'],
		['auto_enrich', 'Auto Enrich', 'boolean'],
		['started_at', 'Started At', 'datetime'],
	],
	enrichment: [
		['id', 'Enrichment ID'],
		['source__kind', 'Source Kind'],
		['source__id', 'Source ID'],
		['status', 'Status'],
		['status_reason', 'Status Reason'],
		['processed', 'Captures Processed', 'integer'],
		['errors', 'Errors', 'integer'],
		['duration_ms', 'Duration (ms)', 'integer'],
	],
	import: [
		['id', 'Import ID'],
		['name', 'File Name'],
		['status', 'Status'],
		['status_reason', 'Status Reason'],
		['success_count', 'Captures Imported', 'integer'],
		['error_count', 'Rows Rejected', 'integer'],
	],
};

/** Look a header up in Zapier's raw request, which may prefix names with `Http-`. */
const rawHeader = (headers, name) => {
	const wanted = [name, `http-${name}`];
	const key = Object.keys(headers || {}).find((candidate) =>
		wanted.includes(candidate.toLowerCase()),
	);
	return key === undefined ? undefined : headers[key];
};

/** The envelope a delivery would carry for a resource, for samples. */
const sampleEvent = (event, resource) => ({
	id: `evt_sample_${resource.id}`,
	type: event.type,
	created_at: resource.updated_at || resource.created_at,
	data: resource,
});

const subscribe = (event) => async (z, bundle) => {
	const response = await z.request({
		method: 'POST',
		url: `${apiUrl()}/v1/webhooks`,
		headers: idempotencyKey(),
		body: {
			url: bundle.targetUrl,
			event_types: [event.type],
			description: `Zapier: ${event.label}`.slice(0, MAX_DESCRIPTION_LENGTH),
		},
	});
	// Holds the endpoint id and its signing secret, which the API returns only here.
	return response.data;
};

const unsubscribe = async (z, bundle) => {
	const id = bundle.subscribeData && bundle.subscribeData.id;
	if (!id) return {};
	const response = await z.request({
		method: 'DELETE',
		url: `${apiUrl()}/v1/webhooks/${encodeURIComponent(id)}`,
		skipThrowForStatus: true,
	});
	// A 404 means the endpoint is already gone, which is the goal.
	if (response.status !== 404) response.throwForStatus();
	return {};
};

const perform = (event) => async (z, bundle) => {
	const secret = bundle.subscribeData && bundle.subscribeData.secret;
	const raw = bundle.rawRequest || {};
	const verified =
		typeof secret === 'string' &&
		typeof raw.content === 'string' &&
		verifySignature(secret, {
			id: rawHeader(raw.headers, 'webhook-id'),
			timestamp: rawHeader(raw.headers, 'webhook-timestamp'),
			signature: rawHeader(raw.headers, 'webhook-signature'),
			body: raw.content,
		});
	if (!verified) {
		z.console.log('Ignored a delivery without a valid Extralt signature');
		return [];
	}

	const body = bundle.cleanedRequest || {};
	// Each Zap subscribes to one event type. A test event sent from the
	// dashboard carries no resource, so it does not start the Zap.
	if (body.type !== event.type) return [];
	return [body];
};

/** The static sample for an event, when the account has nothing that matches. */
const staticSample = (event) =>
	sampleEvent(event, { ...samples[event.resource], status: event.statuses[0], ...event.sample });

const performList = (event) => async (z, bundle) => {
	const fallback = staticSample(event);
	if (!event.list) return [fallback];

	const response = await z.request({
		url: `${apiUrl()}${event.list}`,
		params: { limit: SAMPLE_PAGE_SIZE },
	});
	const matching = (response.data.data || []).filter(
		(item) => event.statuses.includes(item.status) && (!event.matches || event.matches(item)),
	);
	return matching.length > 0
		? matching.slice(0, 3).map((item) => sampleEvent(event, item))
		: [fallback];
};

/** One REST hook trigger per event type, so each reads as its own option in the Zap editor. */
const eventTrigger = (event) => {
	const noun = NOUNS[event.resource];
	const fields = [...RESOURCE_FIELDS[event.resource], ...(event.fields || [])].map(
		([key, label, type]) => ({
			key: `data__${key}`,
			label,
			...(type ? { type } : {}),
		}),
	);
	return {
		key: event.type.replace('.', '_'),
		noun,
		display: { label: event.label, description: event.description },
		operation: {
			type: 'hook',
			performSubscribe: subscribe(event),
			performUnsubscribe: unsubscribe,
			perform: perform(event),
			performList: performList(event),
			sample: staticSample(event),
			outputFields: [
				{ key: 'id', label: 'Event ID' },
				{ key: 'type', label: 'Event Type' },
				{ key: 'created_at', label: 'Event Time', type: 'datetime' },
				...fields,
			],
		},
	};
};

module.exports = EVENTS.map(eventTrigger);
