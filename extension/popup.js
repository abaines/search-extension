

document.addEventListener('DOMContentLoaded', function () {
	const searchBtn = document.getElementById('searchBtn');
	const wordsTextarea = document.getElementById('words');

	// Restore saved words
	const saved = localStorage.getItem('searchWords');
	if (saved) {
		wordsTextarea.value = saved;
	}

	searchBtn.addEventListener('click', function () {
		const words = wordsTextarea.value.split('\n').map(w => w.trim()).filter(Boolean);
		console.log('Words to search:', words);
		// Save words to localStorage
		localStorage.setItem('searchWords', wordsTextarea.value);
		// Next step: send words to content script for highlighting
	});

	// Save words on popup close (optional, for extra reliability)
	window.addEventListener('unload', function () {
		localStorage.setItem('searchWords', wordsTextarea.value);
	});
});
