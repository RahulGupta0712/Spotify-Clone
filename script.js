console.log("console started!!!")

let currentFolder = "";
let firstAlbum = true;

async function getSongs(folder) {
    currentFolder = folder;
    // console.log(`http://127.0.0.1:3000/SpotifyCloneProject/assets/songs/${folder}`);
    let x = await fetch(`./assets/songs/${folder}`)
    let songsDetails = await x.text();
    // console.log(songsDetails)

    let div = document.createElement('div');
    div.innerHTML = songsDetails;
    let as = div.getElementsByTagName('a');
    // console.log(as);

    let songs = [];

    Array.from(as).forEach(element => {
        if (element.href.endsWith('.mp3')) {
            // console.log(element.textContent)
            songs.push([element.href, element.textContent.split('.mp3')[0]]);
        }
    });

    // show all songs in library
    let songListElt = document.querySelector('.songs-list ul')
    songListElt.innerHTML = "";
    for (const song of songs) {
        songListElt.innerHTML += `<li class="flex jus-space-between items-center gap-20">
        <div class="flex jus-start items-center gap-20">
                        <img class="invert" src="./assets/images/music.svg" alt="Music">
                        <div>
                            <div class="songname">${song[1]}</div>
                            <div class="singername small">Greater Circle</div>
                        </div>
                        </div>
                        <div class="playnow flex jus-end items-center gap-10">
                            <span>Play Now</span>
                            <img class="invert" src="./assets/images/playsong.svg" alt="">
                        </div>
                    </li>`
    }

    // play song
    let index = Math.floor(Math.random() * songs.length)
    playMusic(songs[index][1], !firstAlbum);

    // attach event listener to every song in library in left hand side
    let allSongs = document.querySelector('.songs-list').getElementsByTagName('li')
    // console.log(allSongs)
    Array.from(allSongs).forEach(e => {
        e.addEventListener('click', () => {
            let songName = e.querySelector('.songname').textContent
            playMusic(songName);
        })
    })

    return songs;
}

const toMMSS = (time) => {
    let timeInSeconds = Math.floor(time)
    let min = Math.floor(timeInSeconds / 60);
    let sec = timeInSeconds % 60;
    if (sec < 10) sec = "0" + sec;
    if (min < 10) min = "0" + min;
    return `${min}:${sec}`
}

let audio = new Audio();
// audio.loop = true;
let currentSong = "";

let songs = [];

function playNextSong() {
    for (let index = 0; index < songs.length; index++) {
        const element = songs[index][1];
        if (element == currentSong) {
            // play the previous song and exit
            playMusic(songs[(index + 1) % songs.length][1]); // cyclically next
            break;
        }
    }
}


audio.addEventListener('ended', () => {
    playNextSong();
})

audio.addEventListener('timeupdate', () => {
    document.querySelector('.song-time .current-time').textContent = toMMSS(audio.currentTime)
    let progress = (audio.currentTime / audio.duration) * 100;
    // console.log(progress)
    document.querySelector('.seek-bar .processed-bar').style.width = `${progress}%`;
    document.querySelector('.seek-bar .circle').style.left = `${progress}%`;
})

audio.addEventListener("loadeddata", () => {
    let duration = audio.duration; // duration in seconds
    document.querySelector('.song-time .current-time').textContent = "00:00"
    document.querySelector('.song-time .duration').textContent = `/ ${toMMSS(duration)}`
    // The duration variable now holds the duration (in seconds) of the audio clip
});

const playMusic = (song, playNow = 1) => {
    currentSong = song;
    audio.src = `./assets/songs/${currentFolder}/${song}.mp3`;
    document.querySelector('.seek-bar .processed-bar').style.width = `0%`;
    document.querySelector('.seek-bar .circle').style.left = `0%`;

    // console.log(`./assets/songs/${currentFolder}/${song}.mp3`);
    document.querySelector('.song-name').textContent = song;
    document.getElementById('play-song-btn').src = "./assets/images/playsong.svg"
    if (playNow) {
        audio.play();
        document.getElementById('play-song-btn').src = "./assets/images/pause-button.png"
    }
}

document.getElementById('play-song-btn').addEventListener('click', () => {
    // console.log(audio.duration, audio.currentSrc, audio.currentTime);
    if (audio.paused) {
        audio.play();
        document.getElementById('play-song-btn').src = "./assets/images/pause-button.png"
    }
    else {
        audio.pause();
        document.getElementById('play-song-btn').src = "./assets/images/playsong.svg"
    }
})

async function displayAllAlbums() {
    let x = await fetch(`./assets/songs/`)
    let albumsDetails = await x.text();

    let div = document.createElement('div');
    div.innerHTML = albumsDetails;

    // console.log(div);

    let allAs = div.getElementsByTagName('a');
    let arr = Array.from(allAs);
    // document.querySelector('.card-cont').innerHTML = "";
    arr.slice(1, arr.length - 1).forEach(async e => {
        // console.log(e, e.textContent.slice(0, e.textContent.length - 1));
        let foldername = e.textContent.slice(0, e.textContent.length - 1);
        let folderinfo = await fetch(`./assets/songs/${foldername}/info.json`)
        let folderinfo_json = await folderinfo.json();

        let card = document.createElement('div');
        card.setAttribute("data-folder", foldername);
        card.setAttribute("class", "card");
        card.innerHTML = `<div class="cover">
                            <img src="./assets/songs/${foldername}/cover.jpg" alt="cover">
                            <img class="play-btn" src="./assets/images/play.svg" alt="Play song">
                        </div>
                        <h2>${folderinfo_json.title}</h2>
                        <p>${folderinfo_json.description}</p>`

        document.querySelector('.card-cont').append(card);

        card.addEventListener('click', async event => {
            firstAlbum = false;
            let t = event.currentTarget.dataset.folder
            songs = await getSongs(t);
        })
    })
}


async function main() {
    // all songs
    songs = await getSongs("public songs");


    // display all albums
    displayAllAlbums();


    document.getElementById('prev-song-btn').addEventListener('click', () => {
        // find index of currentSong in songs
        for (let index = 0; index < songs.length; index++) {
            const element = songs[index][1];
            if (element == currentSong) {
                // play the previous song and exit
                playMusic(songs[(index - 1 + songs.length) % songs.length][1]); // cyclically previous
                break;
            }
        }
    })

    document.getElementById('next-song-btn').addEventListener('click', () => {
        // find index of currentSong in songs
        playNextSong();
    })

    let seekBar = document.querySelector('.seek-bar');
    seekBar.addEventListener('click', event => {
        // let progress = (event.offsetX / event.target.getBoundingClientRect().width) * 100;
        let progress = (event.offsetX / seekBar.offsetWidth) * 100;
        document.querySelector('.seek-bar .circle').style.left = progress + "%";
        document.querySelector('.seek-bar .processed-bar').style.width = progress + "%";
        audio.currentTime = (progress / 100) * audio.duration;
    })

    document.querySelector('.hamburger').addEventListener('click', () => {
        if (document.querySelector('.left').style.left != "0px")
            document.querySelector('.left').style.left = 0;
        else
            document.querySelector('.left').style.left = "-150%"
    })

    document.querySelector('.show-on-mobile').addEventListener('click', () => {
        if (document.querySelector('.right-nav').style.display == "block") {
            document.querySelector('.right-nav ul').style.right = "-100%"
            document.querySelector('.right-nav').style.display = "none"
        }
        else {
            document.querySelector('.right-nav ul').style.right = "25px"
            document.querySelector('.right-nav').style.display = "block"
        }
        document.querySelector('.right-nav ul').classList.toggle('hovering-msg');
    })

    document.getElementById('song-volume').addEventListener('input', (event) => {
        audio.volume = event.target.value / 100
        if (event.target.value == 0) {
            document.querySelector('.vol-img').src = "./assets/images/volume-mute.png";
        }
        else if (event.target.value < 50) {
            document.querySelector('.vol-img').src = "./assets/images/volume-down.png";
        }
        else {
            document.querySelector('.vol-img').src = "./assets/images/volume-up.png";
        }
    })

    document.querySelector('.vol-img').addEventListener('click', (event) => {
        // console.log(event, event.target, event.target.src)
        if (event.target.src.endsWith("volume-mute.png")) {
            audio.volume = 0.1;
            event.target.src = "./assets/images/volume-down.png";
            document.getElementById('song-volume').value = 10;
        }
        else {
            audio.volume = 0;
            event.target.src = "./assets/images/volume-mute.png";
            document.getElementById('song-volume').value = 0;
        }
    })

    Array.from(document.getElementsByClassName('card')).forEach(card => {
        card.addEventListener('click', async event => {
            let t = event.currentTarget.dataset.folder
            songs = await getSongs(t);
        })
    })

}

main();


async function showAllCards() {
    let p = new Promise((res, rej) => {
        document.querySelector('.card-cont').style.opacity = 0;
        setTimeout(() => {
            res();
        }, 500);
    }).then(() => {
        document.querySelector('.card-cont').classList.toggle('card-cont-show-all');
        if (document.querySelector('.card-cont').classList.contains('card-cont-show-all')) {
            document.querySelector('.show-all').textContent = 'Hide'
        }
        else {
            document.querySelector('.show-all').textContent = 'Show all'
        }
    }).then(() => {
        document.querySelector('.card-cont').style.opacity = 1;
    })
}

document.querySelector('.show-all').addEventListener('click', () => {
    showAllCards();
})

