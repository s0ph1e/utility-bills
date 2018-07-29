const { bills, directory } = require('./config');
const downloadBill = require('./download-bill');

async function downlooadAllBills () {
	for (let bill of bills) {
		console.log('downloading', bill);
		const {url, name} = bill;
		await downloadBill({url, name, directory});
	}
}

downlooadAllBills();