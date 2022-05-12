const express = require("express");
const cors = require("cors");
const { socketController } = require("../sockets/controller");

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT;
    this.server = require("http").createServer(this.app);
    this.io = require("socket.io")(this.server, {
      cors: true,
      // origins: ["http://localhost:8081"],
    });

    // this.paths = {};

    //Middlewares
    this.middlewares();
    //Rutas de mi aplicación
    // this.routes();
    //sockets
    this.sockets();
  }

  middlewares() {
    //CORS
    this.app.use(cors());
    //Directorio publico
    this.app.use(express.static("public"));
  }

  routes() {
    // this.app.use(this.paths.uploads, require("../routes/uploads"));
  }
  sockets() {
    this.io.on("connection", (socket) => socketController(socket, this.io));
  }

  listen() {
    this.server.listen(this.port, () => {
      console.log("Servidor corriendo en puerto", this.port);
    });
  }
}
module.exports = Server;
