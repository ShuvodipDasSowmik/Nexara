import React, { useEffect, useRef, useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { useAuth } from "../../Context/AuthContext"; // adjust path if needed

function generateRoomId() {
  return Math.random().toString(36).substring(2, 10);
}

// Add TURN server for better connectivity
const servers = {
  iceServers: [
    { urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"] },
    { urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443", "turn:openrelay.metered.ca:443?transport=tcp"], username: "openrelayproject", credential: "openrelayproject" }
  ],
  iceCandidatePoolSize: 10,
};

const firebaseConfig = {
  apiKey: "AIzaSyDeXwBHuy5heDo-P9RhEdtXbjEiowO21B4",
  authDomain: "nexara-dd49b.firebaseapp.com",
  projectId: "nexara-dd49b",
  storageBucket: "nexara-dd49b.firebasestorage.app",
  messagingSenderId: "209126777444",
  appId: "1:209126777444:web:5ffc600340eac5f04bf571",
  measurementId: "G-0HPVKPFCYM"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const firestore = firebase.firestore();

function GroupCall() {
  const { user } = useAuth();
  const username = user?.username || "Anonymous";
  const [joined, setJoined] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [roomId, setRoomId] = useState("");
  const [copied, setCopied] = useState(false);
  const [inputRoomId, setInputRoomId] = useState("");
  const [users, setUsers] = useState([]);
  const [pendingWebRTC, setPendingWebRTC] = useState(null);
  const [iceError, setIceError] = useState(false);
  const [peerState, setPeerState] = useState("");
  const [offerPresent, setOfferPresent] = useState(false);
  const [answerPresent, setAnswerPresent] = useState(false);
  const [offerCandidateCount, setOfferCandidateCount] = useState(0);
  const [answerCandidateCount, setAnswerCandidateCount] = useState(0);
  const localVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const pcRef = useRef(null);

  useEffect(() => {
    setRoomId(generateRoomId());
  }, []);

  // Listen for users in room
  useEffect(() => {
    if (!joined || !roomId) return;
    const unsub = firestore.collection("groupCalls").doc(roomId)
      .onSnapshot(doc => {
        const data = doc.data();
        if (data && data.users) setUsers(data.users);
      });
    return () => unsub();
  }, [joined, roomId]);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to audio element
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      if (remoteStream.getAudioTracks().length > 0) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1.0;
        // Try to play programmatically (some browsers require this)
        remoteAudioRef.current.play().catch(() => {});
      }
    }
  }, [remoteStream]);

  // Add handler for pause/play on remote audio
  useEffect(() => {
    const audioEl = remoteAudioRef.current;
    if (!audioEl) return;
    const handlePause = () => {
      audioEl.pause();
    };
    const handlePlay = () => {
      audioEl.play().catch(() => {});
    };
    audioEl.addEventListener("pause", handlePause);
    audioEl.addEventListener("play", handlePlay);
    return () => {
      audioEl.removeEventListener("pause", handlePause);
      audioEl.removeEventListener("play", handlePlay);
    };
  }, [remoteAudioRef, remoteStream]);

  // --- AUDIO ENHANCEMENT: Use high-pass filter to reduce device/system noise ---
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);
  const highpassRef = useRef(null);

  useEffect(() => {
    if (
      localStream &&
      localStream.getAudioTracks().length > 0 &&
      !localStream._processedForGain
    ) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000 });
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 1.0;

      // Add high-pass filter to reduce low-frequency device/system noise
      highpassRef.current = audioContextRef.current.createBiquadFilter();
      highpassRef.current.type = "highpass";
      highpassRef.current.frequency.value = 180; // 180 Hz cutoff

      const source = audioContextRef.current.createMediaStreamSource(localStream);
      source.connect(highpassRef.current);
      highpassRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);

      localStream._processedForGain = true;

      return () => {
        audioContextRef.current && audioContextRef.current.close();
        audioContextRef.current = null;
        gainNodeRef.current = null;
        highpassRef.current = null;
      };
    }
  }, [localStream]);
  // --- END AUDIO ENHANCEMENT ---

  // WebRTC signaling logic
  const setupWebRTC = async (roomId, username) => {
    const pc = new RTCPeerConnection(servers);
    pcRef.current = pc;
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    const roomRef = firestore.collection("groupCalls").doc(roomId);
    const offerCandidates = roomRef.collection("offerCandidates");
    const answerCandidates = roomRef.collection("answerCandidates");

    pc.onconnectionstatechange = () => {
      setPeerState(pc.connectionState);
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setIceError(true);
      } else {
        setIceError(false);
      }
    };
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
        setIceError(true);
      } else if (pc.iceConnectionState === "connected") {
        setIceError(false);
      }
    };

    pc.ontrack = event => {
      setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = event => {
      if (event.candidate) {
        const candidates = joined === "caller" ? offerCandidates : answerCandidates;
        candidates.add(event.candidate.toJSON());
      }
    };

    // --- AUDIO ENHANCEMENT: Prefer Opus and set bitrate in SDP ---
    function setOpusBitrate(sdp, bitrate = 32000) {
      return sdp.replace(/a=fmtp:111 ([^\r\n]*)/g, (match, params) => {
        if (params.includes("maxaveragebitrate")) return match;
        return `a=fmtp:111 ${params};maxaveragebitrate=${bitrate}`;
      });
    }
    // --- END AUDIO ENHANCEMENT ---

    if (joined === "caller") {
      let offer = await pc.createOffer();
      offer.sdp = setOpusBitrate(offer.sdp, 64000);
      await pc.setLocalDescription(offer);
      await roomRef.set({
        offer,
        users: firebase.firestore.FieldValue.arrayUnion(username),
      }, { merge: true });

      roomRef.onSnapshot(async snapshot => {
        const data = snapshot.data();
        // Only set remote description if answer exists and is valid
        if (!pc.currentRemoteDescription && data?.answer && data.answer?.type && data.answer?.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      });

      answerCandidates.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === "added") {
            pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
          }
        });
      });
    } else if (joined === "answerer") {
      const roomSnapshot = await roomRef.get();
      const data = roomSnapshot.data();
      await roomRef.set({
        users: firebase.firestore.FieldValue.arrayUnion(username),
      }, { merge: true });

      // Only set remote description if offer exists and is valid
      if (data && data.offer && data.offer.type && data.offer.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        let answer = await pc.createAnswer();
        answer.sdp = setOpusBitrate(answer.sdp, 64000);
        await pc.setLocalDescription(answer);
        await roomRef.update({ answer });
      } else if (data && data.offer) {
        // If offer exists but is not valid, log details for debugging
        setErrorMsg("Offer found but invalid format. Please check signaling data.");
        console.warn("Invalid offer format:", data.offer);
        return;
      } else {
        // If offer is missing, retry after a short delay (in case caller is still joining)
        setErrorMsg("No valid offer found in Firestore. Retrying in 2 seconds...");
        setTimeout(() => {
          setPendingWebRTC({ roomId, username });
        }, 2000);
        return;
      }

      offerCandidates.onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === "added") {
            pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
          }
        });
      });
    }
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCreateAndJoin = async () => {
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      setLocalStream(stream);
      setJoined("caller");
      await firestore.collection("groupCalls").doc(roomId).set({
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        users: [username],
      }, { merge: true });
      setPendingWebRTC({ roomId, username });
    } catch (err) {
      let msg = "Cannot access microphone.";
      if (err.name === "NotAllowedError") {
        msg += " Permission denied. Please allow access in your browser settings.";
      } else if (err.name === "NotFoundError") {
        msg += " No microphone found.";
      } else if (err.name === "NotReadableError") {
        msg += " Hardware error. Try restarting your device.";
      } else if (err.name === "TypeError") {
        msg += " Your browser may not support getUserMedia, or the context is insecure (use HTTPS).";
      } else {
        msg += " (" + err.name + ")";
      }
      setErrorMsg(msg);
      console.error("getUserMedia error:", err);
    }
  };

  const handleJoinWithId = async () => {
    if (!inputRoomId) return;
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      setLocalStream(stream);
      setRoomId(inputRoomId); // <-- set roomId before setJoined
      setJoined("answerer");
      await firestore.collection("groupCalls").doc(inputRoomId).set({
        joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
        users: firebase.firestore.FieldValue.arrayUnion(username),
      }, { merge: true });
      setPendingWebRTC({ roomId: inputRoomId, username });
    } catch (err) {
      let msg = "Cannot access microphone.";
      if (err.name === "NotAllowedError") {
        msg += " Permission denied. Please allow access in your browser settings.";
      } else if (err.name === "NotFoundError") {
        msg += " No microphone found.";
      } else if (err.name === "NotReadableError") {
        msg += " Hardware error. Try restarting your device.";
      } else if (err.name === "TypeError") {
        msg += " Your browser may not support getUserMedia, or the context is insecure (use HTTPS).";
      } else {
        msg += " (" + err.name + ")";
      }
      setErrorMsg(msg);
      console.error("getUserMedia error:", err);
    }
  };

  const handleRetryConnection = () => {
    handleLeave();
    if (joined === "caller") {
      handleCreateAndJoin();
    } else if (joined === "answerer") {
      handleJoinWithId();
    }
  };

  useEffect(() => {
    if (localStream && pendingWebRTC) {
      setupWebRTC(pendingWebRTC.roomId, pendingWebRTC.username);
      setPendingWebRTC(null);
    }
  }, [localStream, pendingWebRTC]);

  const handleLeave = async () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setRemoteStream(null);
    setJoined(false);
    setErrorMsg("");
    setInputRoomId("");
    setRoomId(generateRoomId());
    setUsers([]);
    if (roomId && username) {
      try {
        await firestore.collection("groupCalls").doc(roomId).update({
          users: firebase.firestore.FieldValue.arrayRemove(username)
        });
      } catch (e) {
        // Ignore error if room doesn't exist
      }
    }
  };

  // Listen for signaling data and candidate counts
  useEffect(() => {
    if (!roomId) return;
    const roomRef = firestore.collection("groupCalls").doc(roomId);

    const unsubRoom = roomRef.onSnapshot(doc => {
      const data = doc.data();
      setOfferPresent(!!data?.offer);
      setAnswerPresent(!!data?.answer);
      if (data?.offer) console.log("Firestore offer:", data.offer);
      if (data?.answer) console.log("Firestore answer:", data.answer);
    });

    const offerCandidates = roomRef.collection("offerCandidates");
    const answerCandidates = roomRef.collection("answerCandidates");

    const unsubOffer = offerCandidates.onSnapshot(snapshot => {
      setOfferCandidateCount(snapshot.size);
    });
    const unsubAnswer = answerCandidates.onSnapshot(snapshot => {
      setAnswerCandidateCount(snapshot.size);
    });

    return () => {
      unsubRoom();
      unsubOffer();
      unsubAnswer();
    };
  }, [roomId]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-2xl mb-2">Nexara Group Call</h1>
      <div className="mb-4 flex items-center gap-2">
        <span className="font-mono bg-gray-800 px-3 py-1 rounded text-blue-400">
          Room ID: {roomId}
        </span>
        <button
          onClick={handleCopyRoomId}
          className="px-2 py-1 bg-blue-700 rounded text-xs hover:bg-blue-800"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      {!joined && (
        <div className="mb-4 flex flex-col items-center gap-2">
          <div>
            <button
              onClick={handleCreateAndJoin}
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 mr-2"
            >
              Create & Join Room
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={inputRoomId}
              onChange={e => setInputRoomId(e.target.value)}
              className="px-2 py-1 rounded border border-gray-600 bg-gray-800 text-white"
            />
            <button
              onClick={handleJoinWithId}
              disabled={!inputRoomId}
              className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
            >
              Join with ID
            </button>
          </div>
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 px-4 py-2 bg-red-700 rounded text-white max-w-md text-center">
          {errorMsg}
        </div>
      )}
      <div className="mb-4 px-4 py-2 bg-gray-800 rounded text-white max-w-md text-center">
        <div className="font-bold mb-2">Connected Users:</div>
        <ul>
          {users.map(u => (
            <li key={u} className="text-blue-300">{u}</li>
          ))}
        </ul>
      </div>
      <video
        ref={localVideoRef}
        autoPlay
        muted
        playsInline
        className={`w-64 h-48 bg-black rounded mb-4 ${!localStream ? "opacity-50" : ""}`}
        style={{ display: "none" }}
      />
      <audio
        ref={remoteAudioRef}
        autoPlay
        controls
        className="mb-4"
        style={{ display: remoteStream ? "block" : "none" }}
      />
      {joined && !remoteStream && (
        <div className="mb-4 px-4 py-2 bg-yellow-700 rounded text-white max-w-md text-center">
          Waiting for remote audio...
          <div className="mt-2 text-xs text-yellow-200">
            PeerConnection state: {peerState || "unknown"}
          </div>
          <div className="mt-1 text-xs text-yellow-200">
            Offer in Firestore: {offerPresent ? "Yes" : "No"}<br />
            Answer in Firestore: {answerPresent ? "Yes" : "No"}<br />
            OfferCandidates: {offerCandidateCount} | AnswerCandidates: {answerCandidateCount}
          </div>
          <div className="mt-1 text-xs text-yellow-200">
            Check both users are in the same room and joined at different times.<br />
            If stuck, try leaving and rejoining.
          </div>
        </div>
      )}
      {joined && iceError && (
        <div className="mb-4 px-4 py-2 bg-red-700 rounded text-white max-w-md text-center">
          Connection lost or failed. <button onClick={handleRetryConnection} className="underline">Retry</button>
        </div>
      )}
      {joined && (
        <button
          onClick={handleLeave}
          className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
        >
          Leave Call
        </button>
      )}
    </div>
  );
}

export default GroupCall;
