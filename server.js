const express = require("express");
const app = express();
const server = require("http").Server(app);
const {
  v4: uuidv4
} = require("uuid");
const io = require("socket.io")(server);
// Peer

const {
  ExpressPeerServer
} = require("peer");
const peerServer = ExpressPeerServer(undefined,server);

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/peerjs", peerServer);

app.get("/", (req, rsp) => {
  rsp.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", {
    roomId: req.params.room
  });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit("user-connected", userId);

    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message);
    });

    socket.on('leave-room', () => {

      socket.to(roomId).broadcast.emit('user-disconnected', userId);
      socket.leave(roomId);
    })
    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId);
      socket.leave(roomId);
    })
  });
});

server.listen(process.env.PORT || 3030);