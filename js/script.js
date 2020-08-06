window.onload = function () {

	html2canvas(document.querySelector('.image-container'), {
		useCORS: true
	}).then(function (canvas) {
		canvas.setAttribute("id", "canvas");
		document.body.appendChild(canvas);
	});

	document.getElementById('download').addEventListener('click', function() {
		downloadCanvas(this, 'canvas', 'test.png');
	}, false);

	


};


function downloadCanvas(link, canvasId, filename) {
	console.log(link);
	link.href = document.getElementById(canvasId).toDataURL();
	link.download = filename;
}