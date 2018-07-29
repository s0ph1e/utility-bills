const assert = require('assert');

module.exports = schedule;

async function schedule({id, interval, fn}) {
	assert(id, 'id is required');
	assert(interval && typeof interval === 'number', 'interval is required, should be number');
	assert(fn && typeof fn === 'function', 'fn is required, should be function');

	console.info(`${new Date().toISOString()} creating scheduled task ${id}`);

	return runTask({id, fn, interval});
}

async function runTask({id, fn, interval}) {
	console.info(`${new Date().toISOString()} start running task ${id}`);
	try {
		await fn();
		console.info(`${new Date().toISOString()} task ${id} succeeded`);
	} catch (err) {
		console.error(`${new Date().toISOString()} task ${id} failed`, err);
	}

	await wait(interval);
	return runTask({id, fn, interval});
}

function wait(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}