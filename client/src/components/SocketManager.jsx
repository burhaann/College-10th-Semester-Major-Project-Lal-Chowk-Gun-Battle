import { atom, useAtom } from "jotai";
import { useEffect } from "react";
import { io } from "socket.io-client";

// export const socket = io(process.env.URL);
export const socket = io("http://localhost:3000");

export const messagesAtom = atom([]);

export const SocketManager = () => {
  const [_messages, setMessages] = useAtom(messagesAtom);
  // useEffect(() => {
  //   function onConnect() {
  //     console.log("connected");
  //   }
  //   function onDisconnect() {
  //     console.log("disconnected");
  //   }

  //   function onHello() {
  //     console.log("hello");
  //   }

  //   function onChat(data) {
  //     setMessages((prevMessages) => [...prevMessages, data]);
  //   }

  //   socket.on("connect", onConnect);
  //   socket.on("disconnect", onDisconnect);
  //   socket.on("hello", onHello);
  //   socket.on("chat", onChat);
  //   return () => {
  //     socket.off("connect", onConnect);
  //     socket.off("disconnect", onDisconnect);
  //     socket.off("hello", onHello);
  //     socket.off("chat", onChat);
  //   };
  // }, []);
};
