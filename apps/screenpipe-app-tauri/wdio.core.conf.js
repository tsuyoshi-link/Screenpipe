// screenpipe — AI that knows everything you've seen, said, or heard
// https://screenpi.pe
const base = require('./wdio.conf.js');

exports.config = {
	...base.config,
	// Core regression suite for quick TDD loops (must pass before fixing bugs).
	specs: [
		'./e2e/tests/health-check.js',
		'./e2e/tests/app-lifecycle.js',
		'./e2e/tests/search-api.js',
		'./e2e/tests/settings-navigation.js',
		'./e2e/tests/settings-persistence.js',
		'./e2e/tests/onboarding-flow.js'
	],
	mochaOpts: {
		...base.config.mochaOpts,
		timeout: 90000
	}
};
