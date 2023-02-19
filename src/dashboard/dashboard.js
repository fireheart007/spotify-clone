import { fetchRequest } from "../api";
import { ENDPOINT, getItemFromLocalStorage, LOADED_TRACKS, logout, SECTIONTYPE, setItemInLocalStorage } from "../common";

const audio = new Audio();
let displayName;

const onProfileClick = (event) => {
  event.stopPropagation(); //it will stop event bubbling of "DOMContentLoaded" event listener
  const profileMenu = document.querySelector("#profile-menu");
  profileMenu.classList.toggle("hidden");
  if (!profileMenu.classList.contains("hidden")) {
    profileMenu.querySelector("#logout").addEventListener("click", logout);
  }
};
const loadUserProfile =() => {
    return new Promise(async (resolve,reject)=>{
        const defaultImage = document.querySelector("#default-image");
        const profileButton = document.querySelector("#user-profile-btn");
        const displayNameElement = document.querySelector("#display-name");
      
        const { display_name: displayName, images } = await fetchRequest(
          ENDPOINT.userInfo
        );
        if (images?.length) {
          const [{url}]=images;
          defaultImage.classList.add("hidden");
          const profileImageContainer=document.getElementById("profile-image");
          profileImageContainer.innerHTML=`<img src="${url}" alt="profile-image" class="h-6 w-6 rounded-full">`
        } else {
          defaultImage.classList.remove("hidden");
        }
        displayNameElement.textContent = displayName;
      
        profileButton.addEventListener("click", onProfileClick);

        resolve({displayName});
    })
};

const loadPlaylist = async (endpoint, elementId) => {
  const {
    playlists: { items },
  } = await fetchRequest(endpoint);
  const playistSection = document.getElementById(elementId);
  for (let {
    name,
    id,
    description,
    images: [{ url: imageURL }],
  } of items) {
    let playlistItem = document.createElement("section");
    playlistItem.id = id;
    playlistItem.className =
      "bg-black-secondary rounded p-4  hover:cursor-pointer hover:bg-light-black";
    playlistItem.setAttribute("data-type", "playlist");
    playlistItem.addEventListener("click", (event) =>
      onPlaylistItemClicked(event, id)
    );
    playlistItem.innerHTML = `<img src="${imageURL}" alt="${name}" class="rounded mb-2 object-contain shadow"/>
        <h2 class="text-base font-semibold mb-4 truncate">${name}</h2>
        <h3 class="text-sm text-secondary line-clamp-2">${description}</h3>`;

    playistSection.appendChild(playlistItem);
  }
};

const loadPlaylists = () => {
  loadPlaylist(ENDPOINT.featuredPlayist, "featured-playlist-items");
  loadPlaylist(ENDPOINT.toplists, "top-playlist-items");
};

const onPlaylistItemClicked = (event, id) => {
  const section = { type: SECTIONTYPE.PLAYLIST, playlist: id };
  history.pushState(section, "", `playlist/${id}`);
  loadSection(section);
};

const fillContentForDashboard = () => {
    const coverContent=document.getElementById("cover-content");
    coverContent.innerHTML=`<h1 class="text-6xl font-bold">Hello ${displayName}</h1>`
  const playlistMap = new Map([
    ["featured", "featured-playlist-items"],
    ["top playlists", "top-playlist-items"],
  ]);
  const pageContent = document.getElementById("page-content");
  let innerHTML = ``;
  for (let [type, id] of playlistMap) {
    innerHTML += `<article class="p-4">
        <h1 class="text-2xl mb-4 capitalize font-bold">${type}</h1>
        <section
          id="${id}"
          class="grid grid-cols-auto-fill-cards gap-4"
        >
        </section>
      </article>`;
  }
  pageContent.innerHTML = innerHTML;
};

const fillContentForPlaylist = async (playlistId) => {
    const playlist = await fetchRequest(`${ENDPOINT.playlist}/${playlistId}`);
    const {name,description,tracks,images:[{url}]}=playlist;
    const coverElement=document.getElementById("cover-content");
    coverElement.innerHTML=`
    <img class="object-contain h-48 w-48" src="${url}" alt="${name}">
    <section>
    <h2 id="playlist-name" class="text-8xl font-bold">${name}</h2>
    <p id="playlist-description" class="text-base text-secondary">${description}</p>
    <p id="playlist-details" class="text-xs">${tracks.items.length} songs</p>
    </section>`
    
    const pageContent = document.getElementById("page-content");
  pageContent.innerHTML = ` <header id="playlist-header" class="mx-8 border-secondary border-b-[0.5px] z-10">
    <nav class="py-2">
      <ul class="grid grid-cols-[50px_1fr_1fr_50px] gap-4 text-secondary">
        <li class="justify-self-center">#</li>
        <li>Title</li>
        <li>Album</li>
        <li>🕒</li>
      </ul>
    </nav>
  </header>
  <section id="tracks" class="px-8 text-secondary mt-4">
  </section>
  `;
  loadPlaylistTracks(playlist);
};

const formatTime = (duration) => {
  const min = Math.floor(duration / 60_000);
  const sec = ((duration % 6_000) / 1000).toFixed(0);
  const formattedTime =
    sec == 60 ? min + 1 + ":00" : min + ":" + (sec < 10 ? "0" : "") + sec;
  return formattedTime;
};

const loadPlaylistTracks = ({ tracks: { items } }) => {
  const trackSections = document.getElementById("tracks");
  let trackNo = 1;
  const loadedTracks=[];
  for (let {
    track: {
      album,
      artists,
      id,
      name,
      duration_ms: duration,
      preview_url: previewURL,
    },
  } of items.filter(item=>item.track.preview_url)) { //filter only those items which have preview url
    let track = document.createElement("section");
    track.id = id;
    track.className =
      "track p-1 grid grid-cols-[50px_1fr_1fr_50px] gap-4 text-secondary items-center justify-items-start rounded-md hover:bg-light-black";
    let image = album.images.find((img) => img.height === 64);
    let artistNames = Array.from(artists, (artist) => artist.name).join(", ");
    track.innerHTML = `
          <p class="justify-self-center relative w-full flex items-center justify-center"><span class="track-no">${trackNo++}</span></p>
        <section class="grid grid-cols-[auto_1fr] place-items-center gap-2">
          <img src="${image.url}" alt="${name}" class="h-10 w-10">
          <article class="flex flex-col gap-1 justify-center">
            <h2 class="song-title text-primary text-base line-clamp-1">${name}</h2>
            <p class="text-xs line-clamp-1">${artistNames}</p>
          </article>
        </section>
        <p class="text-sm">${album.name}</p>
        <p class="text-sm">${formatTime(duration)}</p>`;
    const playButton = document.createElement("button");
    playButton.id = `play-track-${id}`;
    playButton.className = "play w-full absolute left-0 text-lg invisible material-symbols-outlined";
    playButton.textContent = "play_arrow";
    playButton.addEventListener("click", (event) =>
      playTrack(event, { name, image, artistNames, previewURL, duration, id })
    );
    track.querySelector("p").appendChild(playButton);
    track.addEventListener("click", (event) => onTrackSelection(id, event));
    trackSections.appendChild(track);
    loadedTracks.push({album, artistNames,id, name,duration, previewURL,image});
  }
  setItemInLocalStorage(LOADED_TRACKS,loadedTracks);
};

const onTrackSelection = (id, event) => {
  document.querySelectorAll("#tracks .track").forEach((trackItem) => {
    if (trackItem.id === id) {
      trackItem.classList.add("bg-gray", "selected");
    } else {
      trackItem.classList.remove("bg-gray", "selected");
    }
  });
};

const togglePlay=()=>{
    if(audio.src){
        if (audio.paused) {
            audio.play();
          } else {
            audio.pause();
          }
    }
}

const findCurrentTrack=()=>{
    const audioControl=document.getElementById("audio-control");
    const trackId=audioControl.getAttribute("data-track-id");
    if(trackId){
        const loadedTracks=getItemFromLocalStorage(LOADED_TRACKS);
        const currentTrackIndex=loadedTracks?.findIndex(trk=>trk.id===trackId);
        return {currentTrackIndex, tracks:loadedTracks};
    }
    return null;
}

const playNextTrack=()=>{
    const {currentTrackIndex=-1,tracks=null}=findCurrentTrack()??{};
    if(currentTrackIndex>-1 && currentTrackIndex<tracks?.length-1){
        playTrack(null,tracks[currentTrackIndex+1]);
    }
}
const playPrevTrack=()=>{
    const {currentTrackIndex=-1,tracks=null}=findCurrentTrack()??{};
    if(currentTrackIndex>0){
        playTrack(null,tracks[currentTrackIndex-1]);
    }
}

const playTrack = (
  event,
  { name, image, artistNames, previewURL, duration, id }
) => {
    if(event?.stopPropagation){
        event.stopPropagation(); //prevent to highlight the playing track when we click on play button in the track
    }
  if (audio.src === previewURL) {
    togglePlay();
  } else {
    const nowPlayingSongImage = document.getElementById("now-playing-image");
    const songTitle = document.getElementById("now-playing-song");
    const artists = document.getElementById("now-playing-artists");
    const audioControl=document.getElementById("audio-control");
    const songInfo=document.getElementById("song-info");

    audioControl.setAttribute("data-track-id",id)
    nowPlayingSongImage.src = image.url;
    songTitle.textContent = name;
    artists.textContent = artistNames;
    audio.src = previewURL;

    audio.play();
    songInfo.classList.remove("invisible");
  }
};

const updateIconsForPlayMode = (id) => {
    const playButton=document.getElementById("play");
    playButton.querySelector("span").textContent = "pause_circle"; //changing play button to pause button
    const playButtonFromTracks = document.getElementById(`play-track-${id}`);
    if(playButtonFromTracks){
        playButtonFromTracks.textContent = "pause";
    }
};

const updateIconsForPauseMode = (id) => {
    const playButton=document.getElementById("play");
    playButton.querySelector("span").textContent = "play_circle"; //changing play button to pause button
    const playButtonFromTracks = document.getElementById(`play-track-${id}`);
    if(playButtonFromTracks){
        playButtonFromTracks.textContent = "play_arrow";
    }
};

const onAudioMetaDataLoaded = () => {
const totalSongDuration = document.getElementById("total-song-duration");
  totalSongDuration.textContent = `0:${audio.duration.toFixed(0)}`;
};

const loadSection = (section) => {
  if (section.type === SECTIONTYPE.DASHBOARD) {
    fillContentForDashboard();
    loadPlaylists();
  } else if (section.type === SECTIONTYPE.PLAYLIST) {
    fillContentForPlaylist(section.playlist);
  }

  document
    .querySelector(".content")
    .removeEventListener("scroll", onContentScroll); //prevent from calling this event listener multiple times
  document
    .querySelector(".content")
    .addEventListener("scroll", onContentScroll);
};

const onContentScroll = (event) => {
  const { scrollTop } = event.target;
  const header = document.querySelector(".header");
  const coverElement = document.getElementById("cover-content");
  const totalHeight=coverElement.offsetHeight;
  const fiftyPercentHeight=totalHeight/2;
  const coverOpacity=100-(scrollTop>=totalHeight?100:((scrollTop/totalHeight)*100));
  coverElement.style.opacity=`${coverOpacity}%`

  let headerOpacity=0;    
  // once 50% of cover element is crossed, start increasing the opacity
  if(scrollTop>fiftyPercentHeight && scrollTop<=totalHeight){
    let totatDistance = totalHeight - fiftyPercentHeight;
        let coveredDistance = scrollTop - fiftyPercentHeight;
        headerOpacity = (coveredDistance / totatDistance) * 100;
    } else if (scrollTop > totalHeight) {
        headerOpacity = 100;
    } else if (scrollTop < fiftyPercentHeight) {
        headerOpacity = 0;
    }

  header.style.background=`rgba(0 0 0 / ${headerOpacity}%)`;

  if (history.state.type === SECTIONTYPE.PLAYLIST) {
    //if we are inside playlist then only do this
    const playlistHeader = document.getElementById("playlist-header");
    if (headerOpacity>=60) {
      playlistHeader.classList.add("sticky", "bg-black-secondary", "px-8");
      playlistHeader.classList.remove("mx-8");
      playlistHeader.style.top = `${header.offsetHeight}px`;
    } else {
      playlistHeader.classList.remove("sticky", "bg-black-secondary", "px-8");
      playlistHeader.classList.add("mx-8");
      playlistHeader.style.top = `revert`;
    }
  }
};

const onUserPlaylistClick=(id)=>{
    const section={type:SECTIONTYPE.PLAYLIST,playlist:id};
    history.pushState(section,"", `/dashboard/playlist/${id}`);
    loadSection(section);
}

const loadUserPlaylists=async ()=>{
    const playlists=await fetchRequest(ENDPOINT.userPlaylist);
    const userPlaylistSection=document.querySelector("#user-playlists > ul");
    userPlaylistSection.innerHTML="";
    for(let {name,id} of playlists.items){
        const li=document.createElement("li");
        li.textContent=name;
        li.className="cursor-pointer hover:text-primary";
        li.addEventListener("click",()=>onUserPlaylistClick(id));
        userPlaylistSection.appendChild(li);
    }
}

document.addEventListener("DOMContentLoaded", async() => {
    const playButton = document.getElementById("play");
    const volume = document.getElementById("volume");
    const songDurationCompleted = document.getElementById(
    "song-duration-completed"
    );
    const songProgress = document.getElementById("progress");
    const timeline = document.getElementById("timeline");
    const audioControl=document.getElementById("audio-control");
    const next = document.getElementById("next");
    const prev = document.getElementById("prev");
    let progressInterval;

  ({displayName}=await loadUserProfile());
  loadUserPlaylists();
  const section = { type: SECTIONTYPE.DASHBOARD };
  history.pushState(section, "", "");
  loadSection(section);
  document.addEventListener("click", () => {
    const profileMenu = document.querySelector("#profile-menu");
    if (!profileMenu.classList.contains("hidden")) {
      profileMenu.classList.add("hidden");
    }
  });
  
  audio.addEventListener("play",()=>{
    const selectedTrackId= audioControl.getAttribute("data-track-id");
    const tracks=document.getElementById("tracks");
    const selectedTrack=tracks?.querySelector(`[id="${selectedTrackId}"]`);
    const playingTrack=tracks?.querySelector(".playing")
    if(playingTrack?.id!==selectedTrack.id){
        playingTrack?.classList.remove("playing"); //removing playing class from the already played song
    }
    selectedTrack?.classList.add("playing");
    progressInterval = setInterval(() => {
      if (audio.paused) {
        return;
      }
      songDurationCompleted.textContent = `${
        audio.currentTime.toFixed(0) < 10
          ? "0:0" + audio.currentTime.toFixed(0)
          : "0:" + audio.currentTime.toFixed(0)
      }`;
      songProgress.style.width = `${
        (audio.currentTime / audio.duration) * 100
      }%`;
    }, 10);
    updateIconsForPlayMode(selectedTrackId);
  })

  audio.addEventListener("pause",()=>{
    const selectedTrackId= audioControl.getAttribute("data-track-id");
    if(progressInterval){
        clearInterval(progressInterval);
    }
    updateIconsForPauseMode(selectedTrackId);
  })

  audio.addEventListener("loadedmetadata",onAudioMetaDataLoaded); //if all the data required for song is loaded then call onAudioMetaDataLoaded func.

  playButton.addEventListener("click",togglePlay);

  volume.addEventListener("change", () => {
    audio.volume = volume.value / 100;
  });

  timeline.addEventListener("click", (event) => {
    const timelineWidth = window.getComputedStyle(timeline).width;
    const timeToSeek =
      (event.offsetX / parseInt(timelineWidth)) * audio.duration;
    audio.currentTime = timeToSeek;
    songProgress.style.width=`${(audio.currentTime/audio.duration)*100}%`;
  });

  next.addEventListener("click",playNextTrack);
  prev.addEventListener("click",playPrevTrack);

  window.addEventListener("popstate", (event) => {
    loadSection(event.state);
  });
});
