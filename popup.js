const fetchButton = document.getElementById("fetchPlaylist");
const urlInput = document.getElementById("playlistUrl");
const speedInput = document.getElementById("playbackSpeed");
const totalTimeEl = document.getElementById("totalTime");
const adjustedTimeEl = document.getElementById("adjustedTime");

let totalSeconds = 0;

// Event listener for Fetch Playlist button
fetchButton.addEventListener("click", async () => {
  const playlistUrl = urlInput.value.trim();
  if (!playlistUrl) {
    alert("Please enter a valid YouTube Playlist URL");
    return;
  }

  totalSeconds = 0; // Reset total time
  totalTimeEl.textContent = "Fetching playlist duration...";
  adjustedTimeEl.textContent = "";

  await fetchPlaylistDuration(playlistUrl);
});

// Event listener for Playback Speed change
speedInput.addEventListener("input", updateAdjustedTime);

async function fetchPlaylistDuration(url) {
  try {
    const playlistId = getPlaylistIdFromUrl(url);
    if (!playlistId) {
      alert("Invalid YouTube Playlist URL");
      return;
    }

    const apiKey = "AIzaSyCP3HjtEtapc2P70yb6ql3nPdOg1aV2Ans"; // Replace with your API Key
    let nextPageToken = "";
    totalSeconds = 0;

    do {
      const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${playlistId}&key=${apiKey}&maxResults=50&pageToken=${nextPageToken}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      // Extract video IDs
      const videoIds = data.items.map(item => item.contentDetails.videoId).join(",");
      if (videoIds.length > 0) {
        await fetchVideoDurations(videoIds, apiKey);
      }

      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    const totalTime = formatTime(totalSeconds);
    totalTimeEl.textContent = `Total Duration: ${totalTime}`;
    updateAdjustedTime();
  } catch (error) {
    console.error("Error fetching playlist duration:", error);
    alert("Failed to fetch playlist. Check your API Key and URL.");
  }
}

async function fetchVideoDurations(videoIds, apiKey) {
  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`;
  const response = await fetch(apiUrl);
  const data = await response.json();

  data.items.forEach(video => {
    const duration = video.contentDetails.duration;
    totalSeconds += parseISO8601Duration(duration);
  });
}

function getPlaylistIdFromUrl(url) {
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function parseISO8601Duration(duration) {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = duration.match(regex);
  const hours = parseInt(matches[1]) || 0;
  const minutes = parseInt(matches[2]) || 0;
  const seconds = parseInt(matches[3]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

function updateAdjustedTime() {
  const playbackSpeed = parseFloat(speedInput.value) || 1.0;
  if (playbackSpeed <= 0) {
    alert("Playback speed must be greater than 0");
    return;
  }

  const adjustedSeconds = totalSeconds / playbackSpeed;
  adjustedTimeEl.textContent = `Adjusted Duration at ${playbackSpeed}x: ${formatTime(adjustedSeconds)}`;
}
