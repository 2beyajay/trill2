let user;

let getUsername
let chartMain;
let loading;
let downloadCollageButton;

window.onload = function () {

	getUsername = document.querySelector('#getUsername');
	chartMain = document.querySelector('#chartMain');
	loading = document.querySelector('#loading');
	downloadCollageButton = document.querySelector('#downloadCollage');

	getUsername.addEventListener('submit', (e) => {
		e.preventDefault();
		let username = e.target[0].value; //getting the value of the username input field
		let period = e.target[1].value; //getting the value of the period dropdown field
		user = new User(username, period); // making a user object with the given username and the period selected
		getUserData()
	})
};



async function getUserData() {

	getUsername.classList.add('hide')
	loading.classList.remove('hide')

	let infoUrl = user.getUrl('getInfo')
	let toptracksUrl = user.getUrl('gettoptracks')
	let topArtistsUrl = user.getUrl('gettopartists')
	let topAlbumsUrl = user.getUrl('gettopalbums')

	// saving all the userdata in the class
	user.allUserData.totalDuration = 240 * (await getInfo(infoUrl)) //user info saved in the user class
	user.allUserData.top10.tracks = await getTopTracks(toptracksUrl) //top tracks saved in the user class
	user.allUserData.top10.artists = await getTopArtists(topArtistsUrl) //top artists saved in the user class
	user.allUserData.top10.albums = await getTopAlbums(topAlbumsUrl) //top albums saved in the user class

	await user.makeCollageArrays(); // making the array of urls for collage
	await makeImages(user.allUserData.forCollage) // placing the collage in the DOM using url

	// calling charting functions
	await makeDurationChart();
	await makeTopTracksChart();
	await makeTopAlbumsChart();
	await makeTopArtistsChart();

	setTimeout(() => {
		makeCanvas();
	}, 1000);
}

async function makeImages(images) {

	let imageContainer = document.querySelector('.image-container');
	let divClasses = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

	for (let i = 0; i < 7; i++) {
		let img = new Image();
		img.src = images[i];
		img.classList.add('onePhoto')

		let div = document.createElement("div");
		div.classList.add(divClasses[i])
		div.appendChild(img);
		imageContainer.appendChild(div);
		console.log(div);
	}

	chartMain.classList.remove('hide')
	getUsername.classList.remove('hide')
	loading.classList.add('hide')
}

async function makeCanvas() {
	html2canvas(document.querySelector('.image-container'), {
		useCORS: true //enabling external links
	}).then(function (canvas) {
		downloadCollageButton.addEventListener('click', () => {
			ReImg.fromCanvas(canvas).downloadPng('collage') //ReImg library to convert canvas and force user to download it
		})
	});
}

function debugBase64(base64URL) {
	var win = window.open();
	win.document.write('<iframe src="' + base64URL + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
}





async function getInfo(infoUrl) {
	let response = await fetch(infoUrl);
	let userInfo = await response.json()
	user.allUserData.accountAge = userInfo.user.registered.unixtime;
	return userInfo.user.playcount
}

async function getTopTracks(toptracksUrl) {
	let response = await fetch(toptracksUrl);
	let topTracksRaw = await response.json()
	return topTracksRaw.toptracks.track.sort(compare);
}

async function getTopArtists(topArtistsUrl) {
	let response = await fetch(topArtistsUrl);
	let topArtistsRaw = await response.json()
	return topArtistsRaw.topartists.artist;
}

async function getTopAlbums(topAlbumsUrl) {
	let response = await fetch(topAlbumsUrl);
	let topAlbumsRaw = await response.json()
	return topAlbumsRaw.topalbums.album;
}


class User {
	constructor(username, period) {
		this.username = username;
		this.api_key = 'b8c9f662a983905faafe02bc920630da';
		this.period = period;

		this.allUserData = {
			accountAge: 0,
			totalDuration: 0,
			top10: {
				tracks: {},
				artists: {},
				albums: {},
			},
			forCollage: []
		}
	}

	getUrl(method) {
		let url = `http://ws.audioscrobbler.com/2.0/?method=user.${method}&user=${this.username}&api_key=${this.api_key}&format=json&limit=10&period=${this.period}`;
		return url;
	}

	makeCollageArrays() {
		let albums = this.allUserData.top10.albums;
		albums.forEach(album => {
			this.allUserData.forCollage.push(album.image[3]['#text'])
		});
	}
}

function compare(a, b) {

	let x, y;
	if (a.duration) {
		x = a.playcount * a.duration;
		y = b.playcount * b.duration;
	} else{
		x = a.playcount;
		y = b.playcount;
	}

	let comparison = 0;
	if (x > y) {
		comparison = -1;
	} else if (x < y) {
		comparison = 1;
	}
	return comparison;
}



async function makeDurationChart() {

	let accountAgeHours = (user.allUserData.accountAge / 3600).toFixed(0);

	let userSleep = (accountAgeHours / 3).toFixed(0); //dividing by 3 cuz 24/8 = 3. 8hr sleep per 24 hours
	accountAgeHours = accountAgeHours - userSleep

	let totalDurationHours = (user.allUserData.totalDuration / 3600).toFixed(0);

	document.getElementById('totalDurationHours').innerHTML = `Time you've spent swining to the tunes: ${totalDurationHours.toLocaleString()} Hours out of the last ${accountAgeHours.toLocaleString()} hours you've been awake`


	let ctx = document.getElementById('playcountChart').getContext('2d');
	// For a pie chart
	let playcountChart = new Chart(ctx, {
		type: 'pie',
		data: {
			labels: ['Account age(hr)', 'Approx Sleep(hr)', 'Total listening(hr)'],
			datasets: [{
				data: [accountAgeHours, userSleep, totalDurationHours],
				backgroundColor: [
					'rgba(255, 99, 132, 0.2)',
					'rgba(54, 162, 235, 0.2)',
					'rgba(255, 206, 86, 0.2)',
				],
				borderColor: [
					'rgba(255, 99, 132, 1)',
					'rgba(54, 162, 235, 1)',
					'rgba(255, 206, 86, 1)',
				],
				borderWidth: 1
			}]
		},
	});
}

async function makeTopTracksChart() {

	let tracks = user.allUserData.top10.tracks;

	let trackTimeHours = tracks.map(track => {
		return Math.ceil((track.playcount * track.duration) /3600)
	})
	
	let playcount = tracks.map(track => {
		return track.playcount/10
	})

	let trackTitles = tracks.map(track => {
		return track.name
	})


	let ctx = document.getElementById('tracksChart').getContext('2d');
	let tracksChart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: trackTitles,
			datasets: [{
				label: 'Time Spent(hr)',
				data: trackTimeHours,
				backgroundColor: [
					'rgba(255, 99, 132, 0.2)',
					'rgba(54, 162, 235, 0.2)',
					'rgba(255, 206, 86, 0.2)',
					'rgba(75, 192, 192, 0.2)',
					'rgba(153, 102, 255, 0.2)',
					'rgba(255, 159, 64, 0.2)',
					'rgba(255, 99, 132, 0.2)',
					'rgba(54, 162, 235, 0.2)',
					'rgba(255, 206, 86, 0.2)',
					'rgba(75, 192, 192, 0.2)'
				],
				borderColor: [
					'rgba(255, 99, 132, 1)',
					'rgba(54, 162, 235, 1)',
					'rgba(255, 206, 86, 1)',
					'rgba(75, 192, 192, 1)',
					'rgba(153, 102, 255, 1)',
					'rgba(255, 159, 64, 1)',
					'rgba(255, 99, 132, 1)',
					'rgba(54, 162, 235, 1)',
					'rgba(255, 206, 86, 1)',
					'rgba(75, 192, 192, 1)'
				],
				borderWidth: 1,
				order: 1
			},{
				label: 'Playcount X 10',
				data: playcount,
				borderColor: 'rgba(54, 162, 235, 1)',
				backgroundColor: 'transparent',
				borderWidth: 3,
				order: 2,
				lineTension: 0,
				type: 'line',
			}]
		},
		options: {
			title: {
				display: true,
				text: 'Hours Spent on tracks'
			},
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true
					}
				}]
			}
		}
	});
}

async function makeTopAlbumsChart(){
	let albums = user.allUserData.top10.albums;

	let playcount = albums.map(album => {
		return album.playcount
	})

	let albumTitles = albums.map(album => {
		return album.name
	})


	let ctx = document.getElementById('albumsChart').getContext('2d');
	let albumsChart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: albumTitles,
			datasets: [{
				data: playcount,
				backgroundColor: [
					'rgba(255, 99, 132, 0.2)',
					'rgba(54, 162, 235, 0.2)',
					'rgba(255, 206, 86, 0.2)',
					'rgba(75, 192, 192, 0.2)',
					'rgba(153, 102, 255, 0.2)',
					'rgba(255, 159, 64, 0.2)',
					'rgba(255, 99, 132, 0.2)',
					'rgba(54, 162, 235, 0.2)',
					'rgba(255, 206, 86, 0.2)',
					'rgba(75, 192, 192, 0.2)'
				],
				borderColor: [
					'rgba(255, 99, 132, 1)',
					'rgba(54, 162, 235, 1)',
					'rgba(255, 206, 86, 1)',
					'rgba(75, 192, 192, 1)',
					'rgba(153, 102, 255, 1)',
					'rgba(255, 159, 64, 1)',
					'rgba(255, 99, 132, 1)',
					'rgba(54, 162, 235, 1)',
					'rgba(255, 206, 86, 1)',
					'rgba(75, 192, 192, 1)'
				],
				borderWidth: 1
			}]
		},
		options: {
			legend: {
				display: false
			},
			title: {
				display: true,
				text: 'Hours Spent on Albums'
			},
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true
					}
				}]
			}
		}
	});
}

async function makeTopArtistsChart(){
	let artists = user.allUserData.top10.artists;

	let playcount = artists.map(artist => {
		return artist.playcount
	})

	let artistName = artists.map(artist => {
		return artist.name
	})


	let ctx = document.getElementById('artistsChart').getContext('2d');
	let artistsChart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: artistName,
			datasets: [{
				data: playcount,
				backgroundColor: [
					'rgba(255, 99, 132, 0.2)',
					'rgba(54, 162, 235, 0.2)',
					'rgba(255, 206, 86, 0.2)',
					'rgba(75, 192, 192, 0.2)',
					'rgba(153, 102, 255, 0.2)',
					'rgba(255, 159, 64, 0.2)',
					'rgba(255, 99, 132, 0.2)',
					'rgba(54, 162, 235, 0.2)',
					'rgba(255, 206, 86, 0.2)',
					'rgba(75, 192, 192, 0.2)'
				],
				borderColor: [
					'rgba(255, 99, 132, 1)',
					'rgba(54, 162, 235, 1)',
					'rgba(255, 206, 86, 1)',
					'rgba(75, 192, 192, 1)',
					'rgba(153, 102, 255, 1)',
					'rgba(255, 159, 64, 1)',
					'rgba(255, 99, 132, 1)',
					'rgba(54, 162, 235, 1)',
					'rgba(255, 206, 86, 1)',
					'rgba(75, 192, 192, 1)'
				],
				borderWidth: 1
			}]
		},
		options: {
			legend: {
				display: false
			},
			title: {
				display: true,
				text: 'Hours Spent with Artists'
			},
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true
					}
				}]
			}
		}
	});
}