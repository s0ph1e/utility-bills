const http = require('http');
const fs = require('fs');
const crypto = require('crypto');

module.exports = downloadFile;

async function downloadFile({url, name: prefix, directory}) {
	return new Promise((resolve, reject) => {
		http.get(url, async (res) => {
			const {statusCode} = res;
			const contentType = res.headers['content-type'];

			let error;
			if (statusCode !== 200) {
				error = new Error('Request Failed.\n' + `Status Code: ${statusCode}`);
			} else if (!/^application\/pdf/.test(contentType)) {
				error = new Error('Invalid content-type.\n' + `Expected application/pdf but received ${contentType}`);
			}
			if (error) {
				console.error(error.message);
				res.resume(); // consume response data to free up memory
				return reject(error);
			}

			const filename = generateTemporaryFilename({prefix});
			const fileStream = fs.createWriteStream(filename);
			res.on('data', chunk => fileStream.write(chunk));
			res.on('end', () => {
				try {
					fileStream.end();
					console.log(`file ${filename} saved to fs`);

					checkFileExists({directory, filename}).then(async ({fileExists}) => {
						if (fileExists) {
							console.log(`skipping downloaded file, removing ${filename}`);
							fs.unlinkSync(filename);
							return resolve();
						}
						const savedFilename = saveCurrentInvoice({directory, filename, prefix});
						resolve({savedFilename});
					})
				} catch (e) {
					console.error(e.message);
					reject(e);
				}
			});
		}).on('error', (e) => {
			console.error(`Got error: ${e.message}`);
			reject(e);
		});
	});
}

async function checkFileExists({directory, filename}) {
	let existingDirStat;

	try {
		existingDirStat = fs.statSync(directory);
	} catch (err) {
		if (err.code === 'ENOENT') {
			console.log(`directory ${directory} does not exist, creating directory`);
			await fs.mkdirSync(directory);
			return {fileExists: false};
		}
		throw err;
	}

	if (!existingDirStat.isDirectory()) {
		throw new Error(`${directory} is not a directory`);
	}

	const targetFileHash = await getFileHash(filename);
	const existingFiles = fs.readdirSync(directory);

	for (file of existingFiles) {
		const fileHash = await getFileHash(directory + '/' + file);
		if (fileHash === targetFileHash) {
			console.log(`file with same hash was found, hash = ${fileHash}, fileName = ${file}`);
			return {fileExists: true};
		}
	}
	return {fileExists: false};
}

async function getFileHash(filename) {
	return new Promise((resolve, reject) => {
		const fd = fs.createReadStream(filename);
		const hash = crypto.createHash('sha256');
		hash.setEncoding('hex');

		fd.on('end', () => {
			hash.end();
			const fileHash = hash.read();
			resolve(fileHash);
		});
		fd.pipe(hash);
	});
}

function saveCurrentInvoice({directory, filename: temporaryFilename, prefix}) {
	const filename = generateFilenameForCurrentInvoice({prefix});
	const destinationFilename = `${directory}/${filename}`;
	if (fs.existsSync(destinationFilename)) {
		throw new Error(`file ${destinationFilename} already exists`);
	}
	console.log(`moving ${temporaryFilename} to ${destinationFilename}`);
	fs.renameSync(temporaryFilename, destinationFilename);
	return {savedFilename: filename};
}

function generateTemporaryFilename({prefix = ''} = {}) {
	return `tmp-${prefix}-${new Date().getTime()}.pdf`;
}

function generateFilenameForCurrentInvoice({prefix = ''} = {}) {
	const today = new Date();
	return `${prefix ? `${prefix}-` : ''}${today.toISOString().substr(0, 7)}.pdf`;
}
