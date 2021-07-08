const fs = require('fs');

module.exports = {
    readFiles: () => {
		const users = fs.readFileSync('./src/users.txt', 'utf8').split('\n');
		const listings = fs.readFileSync('./src/listings.txt', 'utf8').split('\n');
		const messages = fs.readFileSync('./src/messages.txt', 'utf8').split('~\n');

		const userRows = users.map((row) => {
			const userInfo = row.split(' ');
			return { username: userInfo[0], password: userInfo[1] };
		});

		const listingsRow = listings.map((listing) => {
			return { url: listing };
		});

		return [userRows, listingsRow, messages];
	},

    sleep: async (ms) => {
        console.log(`🚀     sleeping for ${ms} mins     🚀`);
        return new Promise((resolve) => {
            setTimeout(resolve, ms * 60000);
        });
    },
    
    resetIndex: (index, length) => {
        if (index >= length) {
            index = 0;
        }
        return index;
    }
}