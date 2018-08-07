const assert = require('assert');
assert(process.env.BILL_URL_APARTMENT, 'BILL_URL_APARTMENT is required');
assert(process.env.BILL_URL_PARKING, 'BILL_URL_PARKING is required');
assert(process.env.TELEGRAM_BOT_TOKEN, 'TELEGRAM_BOT_TOKEN is required');
assert(process.env.TELEGRAM_CHAT_ID, 'TELEGRAM_CHAT_ID is required');

module.exports = {
	tmpDirectory: __dirname + '/tmp',
	directory: __dirname + '/downloaded-bills',
	interval: 4 * 60 * 60 * 1000,
	bills: [
		{
			url: process.env.BILL_URL_APARTMENT,
			name: 'apartment'
		},
		{
			url: process.env.BILL_URL_PARKING,
			name: 'parking'
		}
	],
	telegram: {
		botToken: process.env.TELEGRAM_BOT_TOKEN,
		chatIds: [process.env.TELEGRAM_CHAT_ID]
	}
};
