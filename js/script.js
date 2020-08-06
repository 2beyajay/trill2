let getUsername = document.querySelector('#getUsername');
let loading = document.querySelector('#loading')

let user;

getUsername.addEventListener('submit', (e) => {
	e.preventDefault();
	let username = e.target[0].value; //getting the value of the username input field
	let period = e.target[1].value; //getting the value of the period dropdown field
	user = new User(username, period); // making a user object with the given username and the period selected
	getUserData()
})

 

async function getUserData() {

	loading.style.display = 'block'

	let infoUrl = user.getUrl('getInfo')
	let toptracksUrl = user.getUrl('gettoptracks')
	let topArtistsUrl = user.getUrl('gettopartists')
	let topAlbumsUrl = user.getUrl('gettopalbums')
	let topGenresUrl = user.getUrl('gettoptags')

	user.allUserData.totalDuration = 240 * (await getInfo(infoUrl)) //user info saved in the user class
	user.allUserData.top10.tracks = await getTopTracks(toptracksUrl) //top tracks saved in the user class
	user.allUserData.top10.artists = await getTopArtists(topArtistsUrl) //top artists saved in the user class
	user.allUserData.top10.albums = await getTopAlbums(topAlbumsUrl) //top albums saved in the user class
	await user.makeCollageArrays();
	console.log(user);

	loading.style.display = 'none'
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
		console.log(this.period);
		
		this.allUserData = {
			totalDuration: 0,
			top10: {
				tracks: {},
				artists: {},
				albums: {},
			},
			forCollage: {
				artists: [],
				albums: []
			}
		}
	}

	getUrl(method){
		let url = `http://ws.audioscrobbler.com/2.0/?method=user.${method}&user=${this.username}&api_key=${this.api_key}&format=json&limit=10&period=${this.period}`;
		console.log(url);
		return url;
	}

	makeCollageArrays(){

	}
}


window.onload = function () {







	html2canvas(document.querySelector('.image-container'), {
		useCORS: true
	}).then(function (canvas) {
		canvas.setAttribute("id", "canvas");
		document.body.appendChild(canvas);
	});

	document.getElementById('download').addEventListener('click', function () {
		downloadCanvas(this, 'canvas', 'test.png');
	}, false);


};


function downloadCanvas(link, canvasId, filename) {
	console.log(link);
	link.href = document.getElementById(canvasId).toDataURL();
	link.download = filename;
}