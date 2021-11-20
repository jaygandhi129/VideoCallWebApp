const socket = io("/");
const chatInputBox = document.getElementById("chat_message");
const all_messages = document.getElementById("all_messages");
const main__chat__window = document.getElementById("main__chat__window");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {} //To keep track of users currently in room
const audio = new Audio("ding.mp3")
var peer = new Peer(undefined, {
 
});

peer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});
let myVideoStream;
let anotherStream;
var getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);
    let userStream;
    let userVideo;

    peer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");

      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
        userStream = userVideoStream;
        userVideo = video;
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });


    document.addEventListener("keydown", (e) => {
      if (e.which === 13 && chatInputBox.value != "") {
        socket.emit("message", chatInputBox.value);
        chatInputBox.value = "";
      }
    });

    socket.on("createMessage", (msg) => {
      console.log(msg);
      let li = document.createElement("li");
      li.innerHTML = msg;
      all_messages.append(li);
      main__chat__window.scrollTop = main__chat__window.scrollHeight;
    });
  });





peer.on("call", function (call) {
  getUserMedia({
      video: true,
      audio: true
    },
    function (stream) {
      call.answer(stream); // Answer the call with an A/V stream.
      const video = document.createElement("video");
      call.on("stream", function (remoteStream) {
        addVideoStream(video, remoteStream);
        anotherStream  = remoteStream;
      });
    },
    function (err) {
      console.log("Failed to get local stream", err);
    }
  );
});

socket.on("user-disconnected", (uId) => {
  if (peers[uId]) {
    document.getElementById(uId).remove()
    peers[uId].remoteStream.getVideoTracks()[0].enabled = false;
    peers[uId].remoteStream.Audio = false;
    // peers[uId].close()
  } 

});

// CHAT

const connectToNewUser = (userId, streams) => {
  var call = peer.call(userId, streams);
  console.log(call);
  var video = document.createElement("video");
  video.id = userId;
  call.on("stream", (userVideoStream) => {
    console.log(userVideoStream);
    addVideoStream(video, userVideoStream);
  });
  peers[userId] = call;
  audio.play();
};

const addVideoStream = (videoEl, stream) => {
  videoEl.srcObject = stream;
  videoEl.addEventListener("loadedmetadata", () => {
    videoEl.play();
  });

  videoGrid.append(videoEl);
  let totalUsers = document.getElementsByTagName("video").length;
  if (totalUsers > 1) {
    for (let index = 0; index < totalUsers; index++) {
      document.getElementsByTagName("video")[index].style.width =
        100 / totalUsers + "%";
    }
  }
};


const hideUnhide = () =>{
  chat_panel = document.getElementById('chat_panel')
  let hidden = chat_panel.style.display
  if(hidden === "none"){
    chat_panel.style.display = "flex";
  }
  else{
    chat_panel.style.display = "none";
  }
}

const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const setPlayVideo = () => {
  const html = `<i class="unmute fa fa-pause-circle"></i>
  <span class="unmute">Resume Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const setStopVideo = () => {
  const html = `<i class=" fa fa-video-camera"></i>
  <span class="">Pause Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `<i class="unmute fa fa-microphone-slash"></i>
  <span class="unmute">Unmute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};
const setMuteButton = () => {
  const html = `<i class="fa fa-microphone"></i>
  <span>Mute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};

function stopBothVideoAndAudio(stream) {
  stream.getTracks().forEach(function (track) {
    if (track.readyState == 'live') {
      track.stop();
    }
  });
}

function leaveRoom() {
  socket.emit('leave-room');
}

function sendMsg(){
  if (chatInputBox.value != "") {
    socket.emit("message", chatInputBox.value);
    chatInputBox.value = "";
  }
}

document.getElementById("leave-meeting").addEventListener("click", leaveRoom);
