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
	await makeImages(user.allUserData.forCollage) // placing the collage in the DOM


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
	}

	chartMain.classList.remove('hide')
	getUsername.classList.remove('hide')
	loading.classList.add('hide')
}

async function makeCanvas() {
	html2canvas(document.querySelector('.image-container'), {
		useCORS: true
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
	return userInfo.user.playcount
}

async function getTopTracks(toptracksUrl) {
	let response = await fetch(toptracksUrl);
	let topTracksRaw = await response.json()
	return topTracksRaw.toptracks.track;
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