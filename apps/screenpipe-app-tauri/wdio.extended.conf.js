// screenpipe — AI that knows everything you've seen, said, or heard
// https://screenpi.pe
const base = require('./wdio.conf.js');

exports.config = {
	...base.config,
	// Extended suite for broader regression and performance sanity checks.
	specs: [
		'./e2e/tests/health-check.js',
		'./e2e/tests/app-lifecycle.js',
		'./e2e/tests/search-api.js',
		'./e2e/tests/settings-navigation.js',
		'./e2e/tests/settings-persistence.js',
		'./e2e/tests/onboarding-flow.js',
		'./e2e/tests/timeline-navigation.js',
		'./e2e/tests/window-overlay.js',
		'./e2e/tests/websocket-performance.js',
		'./e2e/tests/timeline-performance.js',
		'./e2e/tests/db-stress.js',
		'./e2e/tests/mcp-integration.js'
	],
	mochaOpts: {
		...base.config.mochaOpts,
		timeout: 120000
	}
};
