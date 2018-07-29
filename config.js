module.exports = {
	tmpDirectory: __dirname + '/tmp',
	directory: __dirname + '/downloaded-bills',
	interval: 60 * 1000,
	bills: [
		{
			url: 'URL_TO_BILL_HERE',
			name: 'apartment'
		}, {
			url: 'URL_TO_BILL_HERE',
			name: 'parking'
		}
	]
};