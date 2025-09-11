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
        {
            urls: "stun:stun.l.google.com:19302"
        },
        {
            urls: "stun:stun.relay.metered.ca:80",
        },
        {
            urls: "turn:standard.relay.metered.ca:80",
            username: "e69b894a4951520dc2b83333",
            credential: "Lp7vzxLpmjatqGO4",
        },
        {
            urls: "turn:standard.relay.metered.ca:80?transport=tcp",
            username: "e69b894a4951520dc2b83333",
            credential: "Lp7vzxLpmjatqGO4",
        },
        {
            urls: "turn:standard.relay.metered.ca:443",
            username: "e69b894a4951520dc2b83333",
            credential: "Lp7vzxLpmjatqGO4",
        },
        {
            urls: "turns:standard.relay.metered.ca:443?transport=tcp",
            username: "e69b894a4951520dc2b83333",
            credential: "Lp7vzxLpmjatqGO4",
        },
    ]
};

const roomName = 'pi-room';
socket.emit('join room', roomName);

socket.on('created', () => {
    console.log('You created the room.');
    isInitiator = true;
});

socket.on('joined', () => {
    console.log('You joined the room.');

    createPeerConnection();
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            localStream = stream;
            localVideo.srcObject = stream;
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
        })
        .catch(error => console.error('getUserMedia error:', error));
});

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

socket.on('answer', (answer) => {
    console.log('Received answer.');
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

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

function createPeerConnection() {
    peerConnection = new RTCPeerConnection(stunServers);

    peerConnection.ontrack = (event) => {
        console.log('Remote stream added.');
        remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('Sending ICE candidate.');
            socket.emit('ice-candidate', event.candidate, roomName);
        }
    };

    if (isInitiator) {
        navigator.mediaDevices.getUserMedia({
            video: true,
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 48000,
                channelCount: 1
            }
        })
            .then(stream => {
                localStream = stream;
                localVideo.srcObject = stream;
                localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

                peerConnection.createOffer()
                    .then(offer => {
                        let sdp = offer.sdp;

                        // Lower Opus bitrate to ~16kbps
                        sdp = sdp.replace(/opus\/48000.*\r\n/g, match => {
                            return match + "a=fmtp:111 maxaveragebitrate=16000;useinbandfec=1\r\n";
                        });

                        offer.sdp = sdp;
                        peerConnection.setLocalDescription(offer);
                        socket.emit('offer', offer, roomName);
                        console.log('Sending offer with reduced bitrate.');
                    })
                    .catch(error => console.error('createOffer error:', error));

            })
            .catch(error => console.error('getUserMedia error:', error));
    }
}

window.onbeforeunload = () => {
    socket.emit('leave room', roomName);
};