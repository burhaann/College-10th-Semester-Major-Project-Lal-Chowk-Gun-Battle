import { Server } from "socket.io";
import { createServer } from "http";
import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

// const io = new Server({
//   cors: {
//     origin: process.env.ORIGIN,
//   },
// });

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;
// io.listen(process.env.SOCKET_PORT);
const io = new Server(server, {
  cors: {
    origin: process.env.ORIGIN,
  },
});

let connectedUsersCount = 0;

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on("connected", () => console.log("connected"));
mongoose.connection.on("open", () => console.log("open"));
mongoose.connection.on("disconnected", () => console.log("disconnected"));
mongoose.connection.on("reconnected", () => console.log("reconnected"));
mongoose.connection.on("disconnecting", () => console.log("disconnecting"));
mongoose.connection.on("close", () => console.log("close"));

const chatSchema = new mongoose.Schema({
  username: String,
  input: String,
});

const ChatMessage = mongoose.model("ChatMessage", chatSchema);

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, "../client/dist")));
// app.get("/", (req, res) => {
//   res.sendFile(path.resolve(__dirname, "client", "dist", "index.html"));
// });

//Audio Chat --------------------------------------------------------
const socketsStatus = {};

io.on("connection", (socket) => {
  //Audio Chat --------------------------------------------------------
  const socketId = socket.id;
  socketsStatus[socket.id] = {};
  //------------------------------------------------------------------

  connectedUsersCount++;
  // Retrieve all messages from MongoDB and emit to the client
  ChatMessage.find({})
    .then((messages) => {
      socket.emit("chatted", messages);
    })
    .catch((err) => console.error("Error retrieving messages:", err));

  console.log("user connected");

  socket.emit("hello");

  socket.on("disconnect", () => {
    connectedUsersCount--;
    console.log("user disconnected");
    if (connectedUsersCount === 0) {
      // If no users are connected, wipe the database
      ChatMessage.deleteMany({})
        .then(() => console.log("Database wiped"))
        .catch((err) => console.error("Error wiping database:", err));
    }
    //Audio Chat --------------------------------------------------------
    delete socketsStatus[socketId];
  });

  // Listen for chat messages
  socket.on("chat", (data) => {
    // Save message to MongoDB
    const message = new ChatMessage({
      username: data.username,
      input: data.input,
    });
    message.save().catch((err) => console.error("Error saving message:", err));

    io.emit("chat", data); // Broadcast the message to all connected clients
  });

  //Audio Chat --------------------------------------------------------
  socket.on("voice", function (data) {
    var newData = data.split(";");
    newData[0] = "data:audio/ogg;";
    newData = newData[0] + newData[1];

    for (const id in socketsStatus) {
      if (id != socketId && !socketsStatus[id].mute && socketsStatus[id].online)
        socket.broadcast.to(id).emit("send", newData);
    }
  });
  socket.on("userInformation", function (data) {
    socketsStatus[socketId] = data;

    io.sockets.emit("usersUpdate", socketsStatus);
  });
});
server.listen(PORT, () => {
  // io.listen(process.env.SOCKET_PORT);
  console.log(`Server is running on port ${PORT}`);
});
