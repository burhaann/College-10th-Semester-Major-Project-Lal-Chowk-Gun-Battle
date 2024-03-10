import React, { useState, useEffect, useRef } from "react";
import { messagesAtom, socket } from "./SocketManager";
import { useAtom } from "jotai";

const Chat = () => {
  const [messages, setMessages] = useAtom(messagesAtom);

  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");

  const [isChatVisible, setIsChatVisible] = useState(false);

  const inputRef = useRef(null);
  const usernameRef = useRef(null);
  const chatMessagesRef = useRef(null);

  const sendMessage = () => {
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
  useEffect(() => {
    inputRef.current.focus();
  }, []);

  useEffect(() => {
    // Scroll chat-messages to bottom when messages change
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);
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

    socket.on("chat", onChat);
    return () => {
      socket.off("chat", onChat);
    };
  }, []);
  return (
    <div className="container">
      <div className={`chat-container ${isChatVisible ? "visible" : "hidden"}`}>
        <div className="chat-messages" ref={chatMessagesRef}>
          {messages.map((message, index) => (
            <div key={index}>
              <b>{message?.username}:</b> {message.input}
            </div>
          ))}
        </div>
        <div className="username-container">
          Username:
          <input
            ref={usernameRef}
            className="username-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
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
