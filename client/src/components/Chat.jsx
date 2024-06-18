import React, { useState, useEffect, useRef } from "react";
import { messagesAtom, socket } from "./SocketManager";
import { useAtom } from "jotai";
import { myPlayer, usePlayersList, me } from "playroomkit";

const Chat = () => {
  const [messages, setMessages] = useAtom(messagesAtom);

  const players = usePlayersList(true);
  const currentPlayer = myPlayer();
  // const name = players.map((player) =>
  //   myPlayer()?.id === player.id ? player.state.profile?.name : ""
  // );
  // useEffect(() => {
  //   setUsername(name[0]);
  // }, [name[0]]);
  useEffect(() => {
    if (players.length > 0 && currentPlayer) {
      const currentPlayerData = players.find(player => player.id === currentPlayer.id);
      if (currentPlayerData && currentPlayerData.state.profile?.name) {
        setUsername(currentPlayerData.state.profile.name);
      }
    }
  }, [players, currentPlayer]);

  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");

  const [isChatVisible, setIsChatVisible] = useState(false);

  const inputRef = useRef(null);
  const usernameRef = useRef(null);
  const chatMessagesRef = useRef(null);

  const sendMessage = () => {
    if (!input.trim()) {
      // Input is empty or contains only whitespace
      alert("Message box empty. Please enter a Message");
      return;
    }
    // if (!username.trim()) {
    //   // Username is empty or contains only whitespace
    //   alert("Please enter a Username");
    //   return;
    // }
    const data = { username, input };
    socket.emit("chat", data); // Send chat message to server
    setInput("");
  };
  const toggleChatVisibility = () => {
    setIsChatVisible((prevIsVisible) => !prevIsVisible);
  };
  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };
  // useEffect(() => {
  //   inputRef.current.focus();
  // }, []);
  useEffect(() => {
    if (isChatVisible) {
      inputRef.current.focus();
    }
  }, [isChatVisible]);

  useEffect(() => {
    // Scroll chat-messages to bottom when messages change
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);
  useEffect(() => {}, []);
  useEffect(() => {
    const handleXKeyPress = (event) => {
      if (
        (event.ctrlKey && event.key === "x") ||
        (event.ctrlKey && event.key === "X")
      ) {
        toggleChatVisibility();
      }
    };

    document.addEventListener("keydown", handleXKeyPress);

    return () => {
      document.removeEventListener("keydown", handleXKeyPress);
    };
  }, []);
  useEffect(() => {
    function onChat(data) {
      setMessages((prevMessages) => [...prevMessages, data]);
    }
    function onChatted(messages) {
      setMessages((prevMessages) => [...prevMessages, ...messages]);
    }
    socket.on("chat", onChat);
    socket.on("chatted", onChatted);

    return () => {
      socket.off("chat", onChat);
      socket.off("chatted", onChatted);
    };
  }, []);
  return (
    <div className="container">
      <div className={`chat-container ${isChatVisible ? "visible" : "hidden"}`}>
        <div className="chat-messages" ref={chatMessagesRef}>
          {messages.map((message, index) => (
            <div key={index}>
              <b>{message?.username}:</b> {message.input}
              <hr  className="chat-hr-style" />
            </div>
          ))}
        </div>
        {/* <div className="username-container">
          Username:
          <input
            ref={usernameRef}
            className="username-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div> */}
        <div className="chat-input-container">
          <input
            ref={inputRef}
            className="chat-input"
            value={input}
            onKeyDown={handleKeyPress}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="send-button" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
      <button className="toggle-button" onClick={toggleChatVisibility}>
        {isChatVisible ? "Hide Chat" : "Show Chat"}
      </button>
    </div>
  );
};

export default Chat;
