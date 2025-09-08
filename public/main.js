const socket = io({
  auth: {
    token: localStorage.getItem("access_token")
  }
});

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');

let localStream;
let peerConnection;
let isInitiator = false;

const stunServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

// We can join any room name. For simplicity, let's use a fixed one.
const roomName = 'pi-room';
socket.emit('join room', roomName);

// --- Signaling Event Handlers ---

// Event: 'created' - Fired when I am the first person in the room.
socket.on('created', () => {
    console.log('You created the room.');
    isInitiator = true;
});

// Event: 'joined' - Fired when I am the second person in the room.
socket.on('joined', () => {
    console.log('You joined the room.');
    // The second person to join will start the media stream.
    // This triggers the 'offer' process.
    createPeerConnection();
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            localStream = stream;
            localVideo.srcObject = stream;
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
        })
        .catch(error => console.error('getUserMedia error:', error));
});

// Event: 'offer' - The initiator sends an offer.
socket.on('offer', (offer) => {
    if (!isInitiator) {
        console.log('Received offer.');
        createPeerConnection();
        peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                localStream = stream;
                localVideo.srcObject = stream;
                localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

                // Create an answer and send it back
                peerConnection.createAnswer()
                    .then(answer => {
                        peerConnection.setLocalDescription(answer);
                        socket.emit('answer', answer, roomName);
                        console.log('Sending answer.');
                    })
                    .catch(error => console.error('createAnswer error:', error));
            })
            .catch(error => console.error('getUserMedia error:', error));
    }
});

// Event: 'answer' - The peer has answered our offer.
socket.on('answer', (answer) => {
    console.log('Received answer.');
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// Event: 'ice-candidate' - Received a network candidate from the peer.
socket.on('ice-candidate', (candidate) => {
    console.log('Received ICE candidate.');
    const iceCandidate = new RTCIceCandidate(candidate);
    peerConnection.addIceCandidate(iceCandidate);
});

socket.on("connect_error", (err) => {
  if (err.message === "Unauthorised") {
    console.warn("Redirecting to unauthorised page...");
    window.location.href = "/unauthorised.html";
  } else {
    console.error("Connection error:", err.message);
  }
});

// --- WebRTC Logic ---

function createPeerConnection() {
    peerConnection = new RTCPeerConnection(stunServers);

    // Event handler for when a remote stream is added
    peerConnection.ontrack = (event) => {
        console.log('Remote stream added.');
        remoteVideo.srcObject = event.streams[0];
    };

    // Event handler for when a new ICE candidate is found
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('Sending ICE candidate.');
            socket.emit('ice-candidate', event.candidate, roomName);
        }
    };

    // If we are the initiator, create and send an offer.
    if (isInitiator) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                localStream = stream;
                localVideo.srcObject = stream;
                localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

                peerConnection.createOffer()
                    .then(offer => {
                        peerConnection.setLocalDescription(offer);
                        socket.emit('offer', offer, roomName);
                        console.log('Sending offer.');
                    })
                    .catch(error => console.error('createOffer error:', error));
            })
            .catch(error => console.error('getUserMedia error:', error));
    }
}

// Handle user leaving
window.onbeforeunload = () => {
    socket.emit('leave room', roomName);
};
