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

io.on("connection", (socket) => {
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
});
server.listen(PORT, () => {
  // io.listen(process.env.SOCKET_PORT);
  console.log(`Server is running on port ${PORT}`);
});
