const { bills, directory, interval } = require('./config');
const downloadBill = require('./download-bill');
const schedule = require('./scheduler');

async function downloadAllBills () {
	for (let bill of bills) {
		console.log('downloading', bill);
		const {url, name} = bill;

		schedule({
			id: `download-bill-for-${name}`,
			interval,
			fn: () => downloadBill({url, name, directory})
		});
	}
}

downloadAllBills();