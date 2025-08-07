

document.addEventListener('DOMContentLoaded', function () {
	const searchBtn = document.getElementById('searchBtn');
	const wordsTextarea = document.getElementById('words');
	searchBtn.addEventListener('click', function () {
		const words = wordsTextarea.value.split('\n').map(w => w.trim()).filter(Boolean);
		console.log('Words to search:', words);
		// Next step: send words to content script for highlighting
	});
});
