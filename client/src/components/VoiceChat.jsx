import "./VoiceChat.css";
import { socket } from "./SocketManager";
import { useEffect, useState } from "react";
import { BiMicrophoneOff, BiMicrophone } from "react-icons/bi";
import { myPlayer, usePlayersList } from "playroomkit";

const VoiceChat = () => {
  const [isMuted, setIsMuted] = useState(true);
  const [microphoneState, setMicrophoneState] = useState("Muted");
  const [audioContext, setAudioContext] = useState(null);
  const [mediaStreamSource, setMediaStreamSource] = useState(null);
  const [username, setUsername] = useState("");

  const players = usePlayersList(true);
  const name = players.map((player) =>
    myPlayer()?.id === player.id ? player.state.profile?.name : ""
  );

  useEffect(() => {
    if (name[0] === "") {
      return;
    }
    if (name[0]) {
      setUsername(name[0]);
      socket.emit("joinedusername", username);
      socket.username = username;
    }
  }, [name]);

  useEffect(() => {
    const setupAudioStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const audioCtx = new (window.AudioContext ||
          window.webkitAudioContext)();
        audioCtx.latencyHint = "interactive";

        setAudioContext(audioCtx);
        setMediaStreamSource(audioCtx.createMediaStreamSource(stream));
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    };

    const onAllOnlineUsers = (myArray) => {
      const fixedDiv = document.querySelector(".fixed-voice");

      fixedDiv.innerHTML = "";

      myArray.forEach((user) => {
        const joinedUserDiv = document.createElement("div");
        joinedUserDiv.className = "joineduser";

        const h2Element = document.createElement("h2");

        const userSpan = document.createElement("span");
        userSpan.textContent = user;

        h2Element.appendChild(userSpan);

        joinedUserDiv.appendChild(h2Element);

        fixedDiv.appendChild(joinedUserDiv);
      });
    };

    const onAudio1 = (data) => {
      if (audioContext) {
        const audioContext1 = new (window.AudioContext ||
          window.webkitAudioContext)();
        const typedArray = new Float32Array(data);
        const audioBuffer = audioContext1.createBuffer(
          1,
          typedArray.length,
          audioContext1.sampleRate
        );
        const channelData = audioBuffer.getChannelData(0);

        channelData.set(typedArray);

        const audioBufferSource = audioContext1.createBufferSource();
        audioBufferSource.buffer = audioBuffer;
        audioBufferSource.connect(audioContext1.destination);
        audioBufferSource.start();
      }
    };

    window.onload = function () {
      let user = name[0];
      setUsername(user);
      socket.emit("joinedusername", user);
      socket.username = user;

      setupAudioStream();
    };

    socket.on("allonlineusers", onAllOnlineUsers);
    socket.on("audio1", onAudio1);

    return () => {
      socket.off("allonlineusers", onAllOnlineUsers);
      socket.off("audio1", onAudio1);
    };
  }, [audioContext]);

  const toggleMicrophone = () => {
    setIsMuted((prevMuted) => !prevMuted);
    setMicrophoneState((prevState) =>
      prevState === "Muted" ? "Unmuted" : "Muted"
    );
  };
  useEffect(() => {
    if (!isMuted) {
      startStreaming();
    } else {
      stopStreaming();
    }
  }, [isMuted]);
  const startStreaming = () => {
    if (mediaStreamSource) {
      const bufferSize = 2048;
      const scriptNode = audioContext.createScriptProcessor(bufferSize, 1, 1);

      scriptNode.onaudioprocess = function (audioProcessingEvent) {
        const inputBuffer = audioProcessingEvent.inputBuffer;
        const audioData = inputBuffer.getChannelData(0);

        if (!isMuted) {
          socket.emit("audio", audioData);
        }
      };

      mediaStreamSource.connect(scriptNode);
      scriptNode.connect(audioContext.destination);
    }
  };

  const stopStreaming = () => {
    if (mediaStreamSource) {
      mediaStreamSource.disconnect();
    }
  };

  const [isChatVisible, setIsChatVisible] = useState(false);
  const toggleChatVisibility = () => {
    setIsChatVisible((prevIsVisible) => !prevIsVisible);
  };
  useEffect(() => {
    const handleXKeyPress = (event) => {
      if (
        (event.ctrlKey && event.key === "z") ||
        (event.ctrlKey && event.key === "Z")
      ) {
        toggleChatVisibility();
      }
    };

    document.addEventListener("keydown", handleXKeyPress);

    return () => {
      document.removeEventListener("keydown", handleXKeyPress);
    };
  }, []);
  return (
    <>
      <div className="container-voice">
        <div
          className={`chat-container-voice ${
            isChatVisible ? "visible" : "hidden"
          }`}
        >
          <div className="chat-messages-voice">
            <div className="fixed-voice"></div>
          </div>
          <div className="chat-input-container-voice">
            <div id="microphone-icon" onClick={toggleMicrophone}>
              {isMuted ? (
                <BiMicrophoneOff className="mic-image" />
              ) : (
                <BiMicrophone className="mic-image" />
              )}
              <p id="microphone-state">{microphoneState}</p>
            </div>
          </div>
        </div>
        <button className="toggle-button-voice" onClick={toggleChatVisibility}>
          {isChatVisible ? "Hide Voice Chat" : "Show Voice Chat"}
        </button>
      </div>
      {/* <div className="main">
        <div id="microphone-icon" onClick={toggleMicrophone}>
          {isMuted ? (
            <BiMicrophoneOff className="mic-image" />
          ) : (
            <BiMicrophone className="mic-image" />
          )}
          <p id="microphone-state">{microphoneState}</p>
        </div>
      </div>
      <br />
      <br />
      <div className="main">
        <div className="userlist">
          <div className="header">
            <h2>Joined Users</h2>
          </div>
          <div className="fixed"></div>
        </div>
      </div> */}
    </>
  );
};

export default VoiceChat;
