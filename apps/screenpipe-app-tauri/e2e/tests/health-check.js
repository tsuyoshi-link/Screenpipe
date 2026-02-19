describe('Project', () => {
	it('Health check', async () => {
		await browser.waitUntil(
			async () => {
				const readyState = await browser.execute(() => document.readyState);
				return readyState === 'complete';
			},
			{
				timeout: 10000,
				timeoutMsg: 'app did not load in time'
			}
		);

		let res;
		await browser.waitUntil(
			async () => {
				try {
					res = await fetch('http://127.0.0.1:3030/health');
					return res.ok;
				} catch {
					return false;
				}
			},
			{
				timeout: 60000,
				interval: 1000,
				timeoutMsg: 'health endpoint did not become ready in time'
			}
		);
		const json = await res.json();

		expect(res.ok).toBe(true);
		expect(res.status).toBe(200);
		expect(json).toHaveProperty('status');
		expect(['healthy', 'degraded']).toContain(json.status);
	});
});
