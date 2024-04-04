import "./AudioChat.css";
import { socket } from "./SocketManager";
import { useEffect, useRef, useState } from "react";
import { BiMicrophoneOff, BiMicrophone } from "react-icons/bi";
import { myPlayer, usePlayersList } from "playroomkit";

const AudioChat = () => {
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

  //----------------------------------------------------------------
  const [userStatus, setUserStatus] = useState({
    microphone: false,
    mute: false,
    username: username,
    online: false,
  });
  const [users, setUsers] = useState([]);

  const userStatusRef = useRef(userStatus);
  const streamRef = useRef();
  // const mediaRecorderRef = useRef();

  useEffect(() => {
    socket.emit("userInformation", userStatus);
    userStatusRef.current = userStatus;
  }, [userStatus]);

  useEffect(() => {
    let time = 500;

    userStatusRef.current.microphone
      ? navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            streamRef.current = stream;
            var mediaRecorder = new MediaRecorder(stream);
            // mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.start();

            var audioChunks = [];

            mediaRecorder.addEventListener("dataavailable", function (event) {
              audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener("stop", function () {
              var audioBlob = new Blob(audioChunks);

              audioChunks = [];

              var fileReader = new FileReader();
              fileReader.readAsDataURL(audioBlob);
              fileReader.onloadend = function () {
                if (
                  !userStatusRef.current.microphone ||
                  !userStatusRef.current.online
                )
                  return;

                var base64String = fileReader.result;
                socket.emit("voice", base64String);
              };

              if (userStatusRef.current.microphone) mediaRecorder.start();

              setTimeout(function () {
                mediaRecorder.stop();
              }, time);
            });

            setTimeout(function () {
              mediaRecorder.stop();
            }, time);
          })
          .catch((error) => {
            console.error("Error accessing microphone:", error);
          })
      : stopRecording();
    function stopRecording() {
      // if (mediaRecorderRef.current) {
      //   mediaRecorderRef.current.stop();
      // }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        // streamRef.current.getAudioTracks().forEach((track) => track.stop());
      }
    }
    function onUsersUpdate(data) {
      setUsers(Object.values(data).map((user) => user.username));
    }
    function onSend(data) {
      var audio = new Audio(data);
      audio.play();
    }
    socket.on("send", onSend);
    socket.on("usersUpdate", onUsersUpdate);

    return () => {
      socket.off("send", onSend);
      socket.off("usersUpdate", onUsersUpdate);
    };
  }, [userStatus.microphone, userStatus.online]);

  useEffect(() => {
    setUserStatus((prevStatus) => ({
      ...prevStatus,
      username: username,
    }));
    return () => {};
  }, [username]);
  function toggleConnection() {
    setUserStatus((prevStatus) => ({
      ...prevStatus,
      online: !prevStatus.online,
    }));
  }

  function toggleMute() {
    setUserStatus((prevStatus) => ({
      ...prevStatus,
      mute: !prevStatus.mute,
    }));
  }

  function toggleMicrophone() {
    setUserStatus((prevStatus) => ({
      ...prevStatus,
      microphone: !prevStatus.microphone,
    }));
  }

  //----------------------------------------------------------------
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
            <ul className="users">
              {users.map((username, index) => (
                <li key={index}>{username}</li>
              ))}
            </ul>
          </div>
          <div className="chat-input-container-voice">
            <div className="controller">
              <button
                className={`control-btn ${
                  userStatus.microphone ? "enable-btn" : "disable-btn"
                }`}
                onClick={toggleMicrophone}
              >
                {userStatus.microphone ? "Close Microphone" : "Open Microphone"}
              </button>
              <button
                className={`control-btn ${
                  userStatus.mute ? "enable-btn" : "disable-btn"
                }`}
                onClick={toggleMute}
              >
                {userStatus.mute ? "Unmute" : "Mute"}
              </button>
              <button
                className={`control-btn ${
                  userStatus.online ? "enable-btn" : "disable-btn"
                }`}
                onClick={toggleConnection}
              >
                {userStatus.online ? "Go offline" : "Go online"}
              </button>
            </div>
          </div>
        </div>
        <button className="toggle-button-voice" onClick={toggleChatVisibility}>
          {isChatVisible ? "Hide Audio" : "Show Audio"}
        </button>
      </div>
    </>
  );
};

export default AudioChat;
