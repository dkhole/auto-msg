const readline = require('readline');
const control = require('./control');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

const recursiveAsyncReadLineTimeout = (userRows, listings, messages) => {
	rl.question('Enter sleep times (minutes) in the format t1 t2 eg. \'1.4 3\':\n', (input) => {
		const times = input.split(' ');
		if(times.length === 2 && !isNaN(parseFloat(times[0])) && !isNaN(parseFloat(times[1]))) {
			console.log(`Entered t1 = ${times[0]} min and t2 = ${times[1]} min`);
			const timeouts = times.map(time => { return parseFloat(time)});
			recursiveAsyncReadLineBrowser(userRows, listings, messages, timeouts);
		} else {
			console.log('Incorrect format, try again');
			recursiveAsyncReadLineTimeout(userRows, listings, messages);
		}
	});
};

const recursiveAsyncReadLineBrowser = (userRows, listings, messages, timeouts) => {
	rl.question('Are you ready to start? (yes/no)\n', (browser) => {
		if (browser === 'yes') {
			control.startMessaging(userRows, listings, messages, timeouts);
			rl.close();
		} else if (browser === 'no') {
			console.log('Ctrl + C to quit / restart');
			recursiveAsyncReadLineBrowser(userRows, listings, messages, timeouts);
		} else {
			recursiveAsyncReadLineBrowser(userRows, listings, messages, timeouts);
		}
	});
};

const recursiveAsyncReadLineData = (userRows, listings, messages) => {
    rl.question('Do you want to view the input data? (yes/no)\n', (view) => {
        if (view === 'yes') {
            console.log(`~ Users (${userRows.length})`);
            console.log(userRows);
            console.log(`~ Listings (${listings.length})`);
            console.log(listings);
            console.log(`~ Messages (${messages.length})`);
            console.table(messages);
            recursiveAsyncReadLineTimeout(userRows, listings, messages);
        } else if (view === 'no') {
            recursiveAsyncReadLineTimeout(userRows, listings, messages);
        } else {
            recursiveAsyncReadLineData(userRows, listings, messages);
        }
    });
};

module.exports = {
	start: (userRows, listings, messages) => {
		recursiveAsyncReadLineData(userRows, listings, messages);
	},
};