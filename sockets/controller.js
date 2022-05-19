const { Socket } = require("socket.io");
let clients = {};

const socketController = async (socket = new Socket(), io) => {
  // console.log(io);
  console.log(
    "Usuario id:  " +
      socket.id +
      " \nCONECTADO APA, en el momento hay: " +
      io.engine.clientsCount +
      " usuarios conectados"
  );
  console.log("cliente conectado", socket.id);
  // clients[socket.id] = {
  //   username: "",
  //   room: "",
  // };
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
    // clients[socket.id].position = pos;
    console.log(pos);
    io.to(clients[socket.id].room).emit(
      "userPositionsVoxels",
      io.engine.clientsCount,
      socket.id,
      Object.keys(clients),
      pos
    );
    console.log("puso un voxel", socket.id);
  });

  socket.on("removeVoxel", (pos) => {
    // clients[socket.id].position = pos;
    console.log(pos);
    io.to(clients[socket.id].room).emit(
      "removeVoxelScene",
      io.engine.clientsCount,
      socket.id,
      Object.keys(clients),
      pos
    );
    console.log("puso un voxel", socket.id);
  });
  socket.on("actualizarEscena", (arreglo) => {
    // clients[socket.id].position = pos;
    console.log("llego alguien nuevo el arreglo a rederizar es:", arreglo);
    // io.to(clients[socket.id].room).emit(
    //   "removeVoxelScene",
    //   io.engine.clientsCount,
    //   socket.id,
    //   Object.keys(clients),
    //   pos
    // );
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

  socket.on("joinRoom", function (req, callback) {
    console.log(req);
    if (
      req.room.replace(/\s/g, "").length > 0 &&
      req.username.replace(/\s/g, "").length > 0
    ) {
      var nameTaken = false;

      console.log("userInfo", clients);
      Object.keys(clients).forEach((socketId) => {
        var userInfo = clients[socketId];
        console.log("req", req.username);
        // if (userInfo.username.toUpperCase() === req.username.toUpperCase()) {
        //   nameTaken = true;
        // }
      });

      if (nameTaken) {
        callback({
          nameAvailable: false,
          error: "Sorry this username is taken!",
        });
      } else {
        clients[socket.id] = req;
        socket.join(req.room);
        io.to(clients[socket.id].room).emit("actualizar", socket.id);

        callback({
          nameAvailable: true,
        });
      }
    } else {
      callback({
        nameAvailable: false,
        error: "Hey, please fill out the form!",
      });
    }
  });
};

module.exports = {
  socketController,
};
