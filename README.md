# Cat_cam
cat_cam is a modular, peer-to-peer camera streaming service built for real-world use: enabling remote communication with our cat while I was away, so it wouldn’t feel lonely and I could check in on it anytime. Utilised a Raspberry pi with video cam, microphone and speaker to act as my "home" cam, while using my phone/laptop to provide the other peer. Hosted on Render. Designed to simulate production-like systems, it features secure connection handling, structured logging, and maintainable design.

<img width="1568" height="1310" alt="image" src="https://github.com/user-attachments/assets/b1f2376e-a587-415d-914a-84497b6c8b6f" />

## Architecture
- JavaScript WebRTC setup
- Modular peer lifecycle management for extensibility
- Console stream feedback with timestamped events
- Structured logging with peer_id and connection status
- Configurable retry logic and peer discovery
- Security first design: auth token authentication, unauthorised access fallback, traceable logs
<img width="266" height="347" alt="image" src="https://github.com/user-attachments/assets/0ff5dc63-3999-4993-b47b-d443115d6be2" />

## Features
| Feature            | Description                                                  |
|--------------------|--------------------------------------------------------------|
| P2P Streaming          | Direct peer-to-peer video/audi stream setup       |
| Structured Logging  | Inject peer_id and timestamps for traceability         |
| Modular Design | Split connection, logging and config into maintainable, extendable modules              |
| Retry Logic | Configurable reconnect intervals and fallback handling              |
| Secure Access | Minimal surface area for peer negotiation and stream exposure, access gated by auth tokens |

<img width="1150" height="444" alt="image" src="https://github.com/user-attachments/assets/04de8404-34aa-421f-9d84-93d262aa05c6" />

## Setup
```
# 1. Clone the repo
git clone https://github.com/<your‑username>/cat_cam.git
cd cat_cam

# 2. Install dependencies
npm install

# 3a. Create and set auth token variables in the service
// server.js
const allowedTokens = [
    {AUTH_TOKEN_1},
    {AUTH_TOKEN_2},
    {AUTH_TOKEN_3}...
  ];

#3b. Set auth token variables in device
javascript:(function(){localStorage.setItem("access_token", "{AUTH_TOKEN_1}");alert("Token set!");})(); 

# 4. Run the app
npm run start

#5. Navigate to the site provided in the console log (localhost:PORTNAME) on both devices 
```

## Future scope
- Allow more than 2 users to connect
- Automate video recording to store interactions and upload to AWS S3 storage via self-signed uploads
- Improve frontend layout
- Create and implement registration/login auth
