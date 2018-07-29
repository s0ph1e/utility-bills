const http = require('http');
const fs = require('fs');
const crypto = require('crypto');

module.exports = downloadFile;

async function downloadFile({url, name: prefix, directory, tmpDirectory}) {
	return new Promise((resolve, reject) => {
		const req = http.get(url, async (res) => {
			const {statusCode} = res;
			const contentType = res.headers['content-type'];

			let error;
			if (statusCode !== 200) {
				error = new Error(`Request Failed. Status Code: ${statusCode}`);
			} else if (!contentType.startsWith('application/pdf')) {
				error = new Error(`Invalid content-type. Expected application/pdf but received ${contentType}`);
			}
			if (error) {
				res.resume(); // consume response data to free up memory
				return reject(error);
			}

			const tmpFilename = generateTemporaryFilename({tmpDirectory, prefix});
			const fileStream = fs.createWriteStream(tmpFilename);
			res.on('data', chunk => fileStream.write(chunk));
			res.on('end', () => {
				try {
					fileStream.end();
					console.log(`file ${tmpFilename} saved to fs`);
					// TODO: check file size

					checkFileExists({directory, filename: tmpFilename}).then(async ({fileExists}) => {
						if (fileExists) {
							console.log(`skipping downloaded file, removing ${tmpFilename}`);
							fs.unlinkSync(tmpFilename);
							return resolve();
						}
						const savedFilename = saveCurrentBill({directory, filename: tmpFilename, prefix});
						resolve({savedFilename});
					})
				} catch (err) {
					reject(err);
				}
			});
		});

		req.setTimeout(3000);

		req.on('timeout', () => {
			req.abort();
			reject(new Error('Request is timed out'));
		});
		req.on('error', (err) => {
			reject(err);
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

function saveCurrentBill({directory, filename: temporaryFilename, prefix}) {
	const filename = generateFilenameForCurrentBill({prefix});
	const destinationFilename = `${directory}/${filename}`;
	if (fs.existsSync(destinationFilename)) {
		throw new Error(`file ${destinationFilename} already exists`);
	}
	console.log(`moving ${temporaryFilename} to ${destinationFilename}`);
	fs.renameSync(temporaryFilename, destinationFilename);
	return {savedFilename: filename};
}

function generateTemporaryFilename({prefix = '', tmpDirectory = ''} = {}) {
	return `${tmpDirectory}/tmp-${prefix}-${new Date().getTime()}.pdf`;
}

function generateFilenameForCurrentBill({prefix = ''} = {}) {
	// TODO: parse date from bill (maybe google vision?)
	const today = new Date();
	return `${prefix ? `${prefix}-` : ''}${today.toISOString().substr(0, 7)}.pdf`;
}
