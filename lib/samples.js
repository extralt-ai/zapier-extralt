'use strict';

/**
 * Sample objects for the Zap editor when the account has nothing to show yet,
 * shaped like API v1 responses.
 */

const robot = {
	id: 'jd7c4hq2zr8m1v6x9t3k5n0wbe2f7ays',
	name: 'example-store_com_US',
	host: 'www.example-store.com',
	country: 'US',
	language: 'en',
	status: 'completed',
	status_reason: null,
	finished: true,
	run_count: 4,
	created_at: '2026-09-28T08:14:03Z',
	updated_at: '2026-09-28T08:31:40Z',
};

const run = {
	id: 'kh72p9xq4c8v1m6z3t5r0n8wbd2f4hje',
	robot_id: robot.id,
	robot_name: robot.name,
	name: 'example-store_com_US_4',
	status: 'completed',
	status_reason: null,
	finished: true,
	triggered_by: 'api',
	auto_enrich: true,
	budget: 100,
	extracted: 100,
	in_queue: 0,
	start_urls: ['https://www.example-store.com/collections/running'],
	created_at: '2026-09-28T08:40:12Z',
	started_at: '2026-09-28T08:40:15Z',
	updated_at: '2026-09-28T08:52:47Z',
};

const enrichment = {
	id: 'nd73k8q2z9x4c1v6m5t0r8wbs2f6ahjn',
	source: { kind: 'run', id: run.id },
	triggered_by: 'auto',
	status: 'completed',
	status_reason: null,
	finished: true,
	budget: null,
	processed: 100,
	errors: 0,
	duration_ms: 36093,
	created_at: '2026-09-28T08:52:48Z',
	started_at: '2026-09-28T08:52:50Z',
	updated_at: '2026-09-28T08:53:26Z',
};

const importSample = {
	id: 'kx79d3q8z2c4v1m6x5t0r9wbn2f7egtp',
	name: 'catalog.csv',
	status: 'completed',
	status_reason: null,
	finished: true,
	success_count: 1250,
	error_count: 3,
	created_at: '2026-09-28T09:02:11Z',
	updated_at: '2026-09-28T09:03:58Z',
};

module.exports = { robot, run, enrichment, import: importSample };
