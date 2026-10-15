'use strict';

const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const { afterEach, before, describe, it } = require('node:test');

const nock = require('nock').default;
const zapier = require('zapier-platform-core');

const App = require('../index');

const appTester = zapier.createAppTester(App);
const API = 'https://api.extralt.com';
const SECRET = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw';
const authData = { api_key: 'ext_test_key' };

/** A delivery as Zapier hands it to `perform`, signed now with `secret`. */
const delivery = (body, { secret = SECRET, subscribeSecret = SECRET } = {}) => {
	const content = JSON.stringify(body);
	const id = body.id;
	const timestamp = String(Math.floor(Date.now() / 1000));
	const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
	const signature = createHmac('sha256', key)
		.update(`${id}.${timestamp}.${content}`)
		.digest('base64');
	return {
		authData,
		subscribeData: { id: 'wh_1', secret: subscribeSecret },
		cleanedRequest: body,
		rawRequest: {
			method: 'POST',
			content,
			// Zapier prefixes forwarded header names with `Http-`.
			headers: {
				'Content-Type': 'application/json',
				'Http-Webhook-Id': id,
				'Http-Webhook-Timestamp': timestamp,
				'Http-Webhook-Signature': `v1,${signature}`,
			},
		},
	};
};

const runCompleted = {
	id: 'evt_1',
	type: 'run.completed',
	created_at: '2026-10-12T10:40:50Z',
	data: { id: 'run_1', status: 'completed' },
};

before(() => {
	nock.disableNetConnect();
});

afterEach(() => {
	assert.ok(nock.isDone(), `pending mocks: ${nock.pendingMocks()}`);
	nock.cleanAll();
});

describe('event triggers', () => {
	it('subscribe creates an endpoint for the one event type and keeps its secret', async () => {
		nock(API, { reqheaders: { authorization: 'Bearer ext_test_key' } })
			.post('/v1/webhooks', {
				url: 'https://hooks.zapier.com/hooks/standard/1/abc/',
				event_types: ['run.completed'],
				description: 'Zapier: Run Completed',
			})
			.matchHeader('idempotency-key', /^[0-9a-f-]{36}$/)
			.reply(201, {
				id: 'wh_1',
				url: 'https://hooks.zapier.com/hooks/standard/1/abc/',
				secret: SECRET,
			});

		const result = await appTester(App.triggers.run_completed.operation.performSubscribe, {
			authData,
			targetUrl: 'https://hooks.zapier.com/hooks/standard/1/abc/',
		});
		assert.equal(result.id, 'wh_1');
		assert.equal(result.secret, SECRET);
	});

	it('unsubscribe deletes the endpoint and accepts one already gone', async () => {
		nock(API).delete('/v1/webhooks/wh_1').reply(204);
		nock(API)
			.delete('/v1/webhooks/wh_2')
			.reply(404, { error: { code: 'not_found', message: 'Webhook not found', request_id: 'r' } });

		const unsubscribe = App.triggers.run_completed.operation.performUnsubscribe;
		await appTester(unsubscribe, { authData, subscribeData: { id: 'wh_1' } });
		await appTester(unsubscribe, { authData, subscribeData: { id: 'wh_2' } });
	});

	it('passes on a delivery signed with the endpoint secret', async () => {
		const result = await appTester(
			App.triggers.run_completed.operation.perform,
			delivery(runCompleted),
		);
		assert.deepEqual(result, [runCompleted]);
	});

	it('drops a delivery signed with another secret', async () => {
		const result = await appTester(
			App.triggers.run_completed.operation.perform,
			delivery(runCompleted, { secret: 'whsec_dGhpcyBpcyBhbm90aGVyIHNlY3JldA==' }),
		);
		assert.deepEqual(result, []);
	});

	it('drops a delivery whose raw request is missing', async () => {
		const bundle = delivery(runCompleted);
		delete bundle.rawRequest;
		const result = await appTester(App.triggers.run_completed.operation.perform, bundle);
		assert.deepEqual(result, []);
	});

	it('drops a signed test event, which carries no resource', async () => {
		const test = {
			id: 'evt_2',
			type: 'webhook.test',
			created_at: '2026-10-12T10:40:50Z',
			data: { webhook_id: 'wh_1', message: 'This is a test event from Extralt.' },
		};
		const result = await appTester(App.triggers.run_completed.operation.perform, delivery(test));
		assert.deepEqual(result, []);
	});

	it('samples recent resources in the matching status, wrapped like a delivery', async () => {
		nock(API)
			.get('/v1/extract/runs')
			.query({ limit: 25 })
			.reply(200, {
				data: [
					{ id: 'run_a', status: 'failed', created_at: '2026-10-12T09:00:00Z' },
					{
						id: 'run_b',
						status: 'completed',
						created_at: '2026-10-12T08:00:00Z',
						updated_at: '2026-10-12T08:30:00Z',
					},
				],
				next_cursor: null,
			});

		const result = await appTester(App.triggers.run_completed.operation.performList, { authData });
		assert.deepEqual(result, [
			{
				id: 'evt_sample_run_b',
				type: 'run.completed',
				created_at: '2026-10-12T08:30:00Z',
				data: {
					id: 'run_b',
					status: 'completed',
					created_at: '2026-10-12T08:00:00Z',
					updated_at: '2026-10-12T08:30:00Z',
				},
			},
		]);
	});
});

describe('enrichment changes trigger', () => {
	const changes = {
		price_decreases: 2,
		price_increases: 0,
		out_of_stock: 0,
		restocked: 0,
		listings_added: 0,
		listings_removed: 0,
		new_lows: 1,
	};

	it('passes a signed changes summary through', async () => {
		const event = {
			id: 'evt_2',
			type: 'enrichment.changes',
			created_at: '2026-10-13T10:40:50Z',
			data: { id: 'enr_1', status: 'completed', changes },
		};
		const result = await appTester(
			App.triggers.enrichment_changes.operation.perform,
			delivery(event),
		);
		assert.deepEqual(result, [event]);
	});

	it('samples only Enrichments that found changes, in any final status', async () => {
		nock(API)
			.get('/v1/enrich/enrichments')
			.query({ limit: 25 })
			.reply(200, {
				data: [
					{ id: 'enr_a', status: 'completed', changes: null },
					{
						id: 'enr_b',
						status: 'completed',
						changes: { ...changes, price_decreases: 0, new_lows: 0 },
					},
					{ id: 'enr_c', status: 'running', changes },
					{ id: 'enr_d', status: 'stopped', changes, updated_at: '2026-10-13T09:00:00Z' },
				],
				next_cursor: null,
			});

		const result = await appTester(App.triggers.enrichment_changes.operation.performList, {
			authData,
		});
		assert.deepEqual(
			result.map((event) => [event.id, event.type]),
			[['evt_sample_enr_d', 'enrichment.changes']],
		);
	});

	it('falls back to a static sample with counts', async () => {
		nock(API)
			.get('/v1/enrich/enrichments')
			.query({ limit: 25 })
			.reply(200, { data: [], next_cursor: null });

		const [sample] = await appTester(App.triggers.enrichment_changes.operation.performList, {
			authData,
		});
		assert.equal(sample.type, 'enrichment.changes');
		assert.equal(sample.data.changes.price_decreases, 12);
	});

	it('subscribes to the changes event only', async () => {
		nock(API)
			.post('/v1/webhooks', (body) => body.event_types.join() === 'enrichment.changes')
			.reply(201, { id: 'wh_2', secret: SECRET });

		const result = await appTester(App.triggers.enrichment_changes.operation.performSubscribe, {
			authData,
			targetUrl: 'https://hooks.zapier.com/hooks/standard/1/abc',
		});
		assert.equal(result.id, 'wh_2');
	});
});

describe('actions', () => {
	it('start run sends only the fields the user filled in', async () => {
		nock(API)
			.post('/v1/extract/runs', { robot_id: 'robot_1' })
			.matchHeader('idempotency-key', /.+/)
			.reply(202, { id: 'run_1', status: 'pending' });

		const result = await appTester(App.creates.start_run.operation.perform, {
			authData,
			inputData: { robot_id: 'robot_1', budget: '', start_urls: [] },
		});
		assert.equal(result.id, 'run_1');
	});

	it('start run skips empty start URLs', async () => {
		nock(API)
			.post('/v1/extract/runs', {
				robot_id: 'robot_1',
				start_urls: ['https://www.example-store.com/collections/running'],
			})
			.reply(202, { id: 'run_1', status: 'pending' });

		await appTester(App.creates.start_run.operation.perform, {
			authData,
			inputData: {
				robot_id: 'robot_1',
				start_urls: ['', 'https://www.example-store.com/collections/running'],
			},
		});
	});

	it('start enrichment offers a Run dropdown, and a plain ID for an Import', () => {
		const sourceId = App.creates.start_enrichment.operation.inputFields[1];
		const fieldFor = (inputData) => {
			const fields = sourceId({}, { inputData });
			// Zapier expects a dynamic field function to return a list of fields.
			assert.ok(Array.isArray(fields));
			assert.equal(fields.length, 1);
			return fields[0];
		};
		assert.equal(fieldFor({}).dynamic, 'run_list.id.label');
		assert.equal(fieldFor({ source_kind: 'run' }).dynamic, 'run_list.id.label');
		assert.equal(fieldFor({ source_kind: 'import' }).dynamic, undefined);
		assert.equal(fieldFor({ source_kind: 'import' }).key, 'source_id');
		// A Run ID must not linger once Source switches to Import.
		assert.deepEqual(fieldFor({ source_kind: 'import' }).dependsOn, ['source_kind']);
		assert.deepEqual(fieldFor({ source_kind: 'run' }).dependsOn, ['source_kind']);
	});

	it('start enrichment sends the source and skips an empty budget', async () => {
		nock(API)
			.post('/v1/enrich/enrichments', { source: { kind: 'import', id: 'imp_1' } })
			.matchHeader('idempotency-key', /.+/)
			.reply(202, { id: 'enr_1', status: 'pending' });

		const result = await appTester(App.creates.start_enrichment.operation.perform, {
			authData,
			inputData: { source_kind: 'import', source_id: 'imp_1', budget: '' },
		});
		assert.equal(result.id, 'enr_1');
	});

	it('shows the API error message and request id', async () => {
		nock(API)
			.post('/v1/extract/runs')
			.reply(402, {
				error: { code: 'insufficient_credits', message: 'Not enough credits', request_id: 'req_1' },
			});

		await assert.rejects(
			appTester(App.creates.start_run.operation.perform, {
				authData,
				inputData: { robot_id: 'r' },
			}),
			(error) => {
				assert.match(error.message, /Not enough credits \(request ID: req_1\)/);
				return true;
			},
		);
	});

	it('asks to reconnect when the API key is rejected', async () => {
		nock(API)
			.get('/v1/webhooks')
			.reply(401, {
				error: { code: 'unauthorized', message: 'Invalid API key', request_id: 'req_2' },
			});

		await assert.rejects(appTester(App.authentication.test, { authData }), (error) => {
			assert.equal(error.name, 'ExpiredAuthError');
			return true;
		});
	});
});

describe('dropdowns', () => {
	for (const key of ['robot_list', 'run_list']) {
		it(`${key} stops after the last page instead of repeating the first`, async () => {
			// No request is mocked: an empty stored cursor must end the list without calling the API.
			const result = await App.triggers[key].operation.perform(
				{ cursor: { get: async () => '' } },
				{ meta: { page: 1 } },
			);
			assert.deepEqual(result, []);
		});
	}
});

describe('authentication', () => {
	it('labels a connection with the end of its API key', () => {
		assert.equal(App.authentication.connectionLabel({}, { authData }), 'API key ending in _key');
	});
});
