const { Socket } = require("socket.io");
let clients = {};

const socketController = async (socket = new Socket(), io) => {
  // console.log(io);
  console.log(
    "Usuario id:  " +
      socket.id +
      " CONECTADO APA, en el momento hay: " +
      io.engine.clientsCount +
      " usuarios conectados"
  );
  console.log("cliente conectado", socket.id);
  clients[socket.id] = {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
  };
  // console.log(clients);

  socket.emit(
    "introduction",
    socket.id,
    io.engine.clientsCount,
    Object.keys(clients)
  );

  io.sockets.emit(
    "newUserConnected",
    io.engine.clientsCount,
    socket.id,
    Object.keys(clients)
  );

  socket.on("move", (pos) => {
    clients[socket.id].position = pos;
    io.sockets.emit("userPositions", clients);
  });
  socket.on("disconnect", () => {
    delete clients[socket.id];
    io.sockets.emit(
      "userDisconnected",
      io.engine.clientsCount,
      socket.id,
      Object.keys(clients)
    );
    console.log(
      "Usuario " +
        socket.id +
        " BYE!, en el momento hay " +
        io.engine.clientsCount +
        " usuarios en linea"
    );

    console.log("CLiente Desconectado", socket.id);
  });
};

module.exports = {
  socketController,
};
