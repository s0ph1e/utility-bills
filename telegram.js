const config = require('./config');
const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(config.telegram.botToken);

module.exports = {
	notifyBillDownloaded,
	notifyErrorOccurred
};

async function notifyBillDownloaded({fileFullPath}) {
	for (const chatId of config.telegram.chatIds) {
		await bot.sendMessage(chatId, 'I got the power and new bills for you.');
		await bot.sendDocument(chatId, fileFullPath);
	}
}

async function notifyErrorOccurred({error}) {
	for (const chatId of config.telegram.chatIds) {
		await bot.sendMessage(chatId, `Something went wrong.\n${error}`);
	}
}
