const { bills, directory, tmpDirectory, interval } = require('./config');
const downloadBill = require('./download-bill');
const schedule = require('./scheduler');
const telegram = require('./telegram');

async function downloadAllBills () {
	for (let bill of bills) {
		console.log('downloading', bill);
		const {url, name} = bill;

		schedule({
			id: `download-bill-for-${name}`,
			interval,
			fn: async () => {
				try {
					const {isFileSaved, fullPath} = await downloadBill({url, name, directory, tmpDirectory});
					if (isFileSaved) {
						await telegram.notifyBillDownloaded({fileFullPath: fullPath});
					}
				} catch (error) {
					await telegram.notifyErrorOccurred({error});
					throw error;
				}
			}
		});
	}
}

downloadAllBills();
