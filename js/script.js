let user;

let getUsername
let chartMain;
let loading;
let downloadCollageButton;
let landingP;

let chartLabelColor = '#d4d4d4'

let playcountChartDiv = document.getElementById('playcountChartDiv');
let tracksChartDiv = document.getElementById('tracksChartDiv');
let artistsChartDiv = document.getElementById('artistsChartDiv');
let albumsChartDiv = document.getElementById('albumsChartDiv');

let hintShown = false;
let hint;
let hintClose;


window.onscroll = function () {
	scrollFunction()
};


window.onload = function () {
	main = document.querySelector('main');
	getUsername = document.querySelector('#getUsername');
	chartMain = document.querySelector('#chartMain');
	loading = document.querySelector('#loading');
	downloadCollageButton = document.querySelector('#downloadCollage');
	landingP = document.querySelector('.landing p');

	hint = document.querySelector('.hint');
	hintClose = document.querySelector('.hint .closebtn');

	getUsername.addEventListener('submit', (e) => {
		e.preventDefault();

		playcountChartDiv.innerHTML = '';
		tracksChartDiv.innerHTML = '';
		artistsChartDiv.innerHTML = '';
		albumsChartDiv.innerHTML = '';


		let username = e.target[0].value; //getting the value of the username input field
		let period = e.target[1].value; //getting the value of the period dropdown field

		if (username && period) {
			user = new User(username, period); // making a user object with the given username and the period selected
			getUserData();
		} else {
			landingP.innerHTML = `<span class="formError" style="color: #d4d4d4">Username can not be empty.</span>`
			setTimeout(() => {
				landingP.innerHTML = `*Use ajaydubey541997 for demonstration.`
			}, 2500);
		}

	})
};


function scrollFunction() {
	let toTop = document.getElementById("toTop");
	let headerLogo = document.querySelector('header img');
	if (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200) {
		toTop.style.display = "block";
		headerLogo.style.padding = '0 6vh'
	} else {
		toTop.style.display = "none";
		headerLogo.style.padding = '0 2.5rem'
	}
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
	document.body.scrollTop = 0;
	document.documentElement.scrollTop = 0;
}



async function getUserData() {

	main.classList.add('hide');
	loading.classList.remove('hide')

	let infoUrl = user.getUrl('getInfo')
	let toptracksUrl = user.getUrl('gettoptracks')
	let topArtistsUrl = user.getUrl('gettopartists')
	let topAlbumsUrl = user.getUrl('gettopalbums')

	// saving all the userdata in the class
	user.allUserData.totalDuration = 240 * (await getInfo(infoUrl)) //user info saved in the user class

	if (user.allUserData.totalDuration > 0) {

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



	} else {
		loading.classList.add('hide')
		main.classList.remove('hide')
		landingP.innerHTML = `<span class="formError" style="color: #d4d4d4">Username not found.</span>`
		setTimeout(() => {
			landingP.innerHTML = `*Use ajaydubey541997 for demonstration.`
		}, 2500);
	}

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
	}

	loading.classList.add('hide')
	main.classList.remove('hide')
	chartMain.classList.remove('hide')

	setTimeout(() => {
		if (!hintShown) {
			hint.classList.add('goUp');
			hintShown = true;
		}
	}, 5000);

	hintClose.addEventListener('click', (e) => {
		hint.classList.remove('goUp');
		hint.classList.add('goDown')
	})

	window.scrollBy(0, window.innerHeight / 1.25)
}


async function makeCanvas() {
	let htmlCollageNode = document.querySelector('.image-container');

	downloadCollageButton.addEventListener('click', () => {
		domtoimage.toBlob(htmlCollageNode)
			.then(function (blob) {
				window.saveAs(blob, 'collage.png');
			});
		count++;
	})

}

function debugBase64(base64URL) {
	var win = window.open();
	win.document.write('<iframe src="' + base64URL + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
}





async function getInfo(infoUrl) {
	try {
		let response = await fetch(infoUrl);
		let userInfo = await response.json()
		user.allUserData.accountAge = userInfo.user.registered.unixtime;
		return userInfo.user.playcount
	} catch (error) {
		return -1
	}
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
		let url = `https://ws.audioscrobbler.com/2.0/?method=user.${method}&user=${this.username}&api_key=${this.api_key}&format=json&limit=10&period=${this.period}`;
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
	} else {
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

	playcountChartDiv.innerHTML = '<canvas id="playcountChart" width="300" height="300"></canvas>';

	let accountAgeHours = (user.allUserData.accountAge / 3600).toFixed(0);

	let userSleep = (accountAgeHours / 3).toFixed(0); //dividing by 3 cuz 24/8 = 3. 8hr sleep per 24 hours
	accountAgeHours = accountAgeHours - userSleep

	let totalDurationHours = (user.allUserData.totalDuration / 3600).toFixed(0);

	let percentSpent = (totalDurationHours / (accountAgeHours - userSleep)) * 100;

	document.getElementById('totalDurationHours').innerHTML = `Time you've spent swining to the tunes: <span>${totalDurationHours.toLocaleString()}</span> Hours out of the last <span>${(accountAgeHours - userSleep).toLocaleString()}</span> hours you've been awake which make up <span>${percentSpent.toFixed(2)}%</span> of your awake time.`


	let ctx = document.getElementById('playcountChart').getContext('2d');
	// For a pie chart
	let playcountChart = new Chart(ctx, {
		type: 'pie',
		data: {
			labels: ['Account age(hr)', 'Approx Sleep(hr)', 'Total listening(hr)'],
			datasets: [{
				data: [accountAgeHours, userSleep, totalDurationHours],
				backgroundColor: [
					'rgba(255, 99, 132, 0.75)',
					'rgba(54, 162, 235, 0.75)',
					'rgba(255, 206, 86, 0.75)',
				],
				borderColor: [
					'rgba(255, 99, 132, 1)',
					'rgba(54, 162, 235, 1)',
					'rgba(255, 206, 86, 1)',
				],
				borderWidth: 1
			}]
		},
		options: {
			legend: {
				labels: {
					fontColor: chartLabelColor
				}
			},
		}
	});
}

async function makeTopTracksChart() {

	tracksChartDiv.innerHTML = '<canvas id="tracksChart" width="400" height="300"></canvas>'

	let tracks = user.allUserData.top10.tracks;

	let tracksLastfmUrl = tracks.map(track => {
		return [track.url, track.name];
	})

	// making the html list for tracks
	let topTracksList = document.querySelector('.topTracksList')
	tracksOlContent = ''
	tracks.forEach(track => {
		tracksOlContent += `<li><a href='${track.url}' target="_blank">${track.name}</a></li>`
	});
	topTracksList.innerHTML = tracksOlContent;


	let trackTimeHours = tracks.map(track => {
		return Math.ceil((track.playcount * track.duration) / 3600)
	})

	let playcount = tracks.map(track => {
		return track.playcount / 10
	})

	let trackTitles = tracks.map(track => {
		return track.name
	})

	let trackUrl = tracks.map(track => {
		return track.url
	})

	let ctx = document.getElementById('tracksChart').getContext('2d');
	let tracksChart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: trackTitles,
			datasets: [{
				label: 'Time spent(hr)',
				data: trackTimeHours,
				backgroundColor: [
					'rgba(255, 99, 132, 0.75)',
					'rgba(54, 162, 235, 0.75)',
					'rgba(255, 206, 86, 0.75)',
					'rgba(75, 192, 192, 0.75)',
					'rgba(153, 102, 255, 0.75)',
					'rgba(255, 159, 64, 0.75)',
					'rgba(255, 99, 132, 0.75)',
					'rgba(54, 162, 235, 0.75)',
					'rgba(255, 206, 86, 0.75)',
					'rgba(75, 192, 192, 0.75)'
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
				order: 2
			}, {
				label: 'Playcount (1 unit = 10 plays)',
				data: playcount,
				borderColor: 'rgba(54, 162, 235, 1)',
				backgroundColor: 'transparent',
				borderWidth: 3,
				order: 1,
				lineTension: 0,
				type: 'line',
			}]
		},
		options: {
			onClick: function (e, i) {
				try {
					e = i[0];
					window.open(trackUrl[e._index], '_blank');
				} catch (error) {
					throw error
				}
			},
			legend: {
				labels: {
					fontColor: chartLabelColor
				}
			},
			title: {
				display: true,
				text: 'Hours Spent on tracks',
				fontColor: chartLabelColor
			},
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true,
						fontColor: chartLabelColor
					}
				}],
				xAxes: [{
					ticks: {
						fontColor: chartLabelColor
					},
				}]
			}
		}
	});
}

async function makeTopAlbumsChart() {

	albumsChartDiv.innerHTML = '<canvas id="albumsChart" width="400" height="300"></canvas>';

	let albums = user.allUserData.top10.albums;

	// making the html list for albums
	let topAlbumsList = document.querySelector('.topAlbumsList')
	albumsOlContent = ''
	albums.forEach(album => {
		albumsOlContent += `<li><a href='${album.url}' target="_blank">${album.name}</a></li>`
	});
	topAlbumsList.innerHTML = albumsOlContent;


	let playcount = albums.map(album => {
		return album.playcount
	})

	let albumTitles = albums.map(album => {
		return album.name
	})

	let albumUrl = albums.map(album => {
		return album.url
	})


	let ctx = document.getElementById('albumsChart').getContext('2d');
	let albumsChart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: albumTitles,
			datasets: [{
				data: playcount,
				backgroundColor: [
					'rgba(255, 99, 132, 0.75)',
					'rgba(54, 162, 235, 0.75)',
					'rgba(255, 206, 86, 0.75)',
					'rgba(75, 192, 192, 0.75)',
					'rgba(153, 102, 255, 0.75)',
					'rgba(255, 159, 64, 0.75)',
					'rgba(255, 99, 132, 0.75)',
					'rgba(54, 162, 235, 0.75)',
					'rgba(255, 206, 86, 0.75)',
					'rgba(75, 192, 192, 0.75)'
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
			onClick: function (e, i) {
				try {
					e = i[0];
					window.open(albumUrl[e._index], '_blank');
				} catch (error) {
					throw error
				}
			},
			legend: {
				display: false
			},
			title: {
				display: true,
				text: 'Playcount of Albums',
				fontColor: chartLabelColor
			},
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true,
						fontColor: chartLabelColor
					}
				}],
				xAxes: [{
					ticks: {
						fontColor: chartLabelColor
					},
				}]
			}
		}
	});
}

async function makeTopArtistsChart() {

	artistsChartDiv.innerHTML = '<canvas id="artistsChart" width="400" height="300"></canvas>';

	let artists = user.allUserData.top10.artists;

	// making the html list for artists
	let topArtistsList = document.querySelector('.topArtistsList')
	artistsOlContent = ''
	artists.forEach(artist => {
		artistsOlContent += `<li><a href='${artist.url}' target="_blank">${artist.name}</a></li>`
	});
	topArtistsList.innerHTML = artistsOlContent;


	let playcount = artists.map(artist => {
		return artist.playcount
	})

	let artistName = artists.map(artist => {
		return artist.name
	})

	let artistUrl = artists.map(artist => {
		return artist.url
	})


	let ctx = document.getElementById('artistsChart').getContext('2d');
	let artistsChart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: artistName,
			datasets: [{
				data: playcount,
				backgroundColor: [
					'rgba(255, 99, 132, 0.75)',
					'rgba(54, 162, 235, 0.75)',
					'rgba(255, 206, 86, 0.75)',
					'rgba(75, 192, 192, 0.75)',
					'rgba(153, 102, 255, 0.75)',
					'rgba(255, 159, 64, 0.75)',
					'rgba(255, 99, 132, 0.75)',
					'rgba(54, 162, 235, 0.75)',
					'rgba(255, 206, 86, 0.75)',
					'rgba(75, 192, 192, 0.75)'
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
			onClick: function (e, i) {
				try {
					e = i[0];
					window.open(artistUrl[e._index], '_blank');
				} catch (error) {
					throw error
				}
			},
			legend: {
				display: false
			},
			title: {
				display: true,
				text: 'Playcount of Artists',
				fontColor: chartLabelColor
			},
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true,
						fontColor: chartLabelColor
					}
				}],
				xAxes: [{
					ticks: {
						fontColor: chartLabelColor
					},
				}]
			}
		}
	});
}


function pageRedirection(goToThisUrl) {
	window.open(goToThisUrl, '_blank');
}