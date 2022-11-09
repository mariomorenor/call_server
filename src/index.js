// Logger
const pino = require("pino");
const logger = pino({
  transport: {
    target: "pino-pretty",
  },
});

// Servidor Express
const express = require("express");
const { createServer } = require("http");
const cors = require("cors");

const app = express();

// Rutas
const routes = require("./routes");

app.use(cors());
app.use(routes);

// Servidor Socket
const { Server } = require("socket.io");
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

// Conexiones y eventos
io.on("connection", (socket) => {

  //   Devuelve los Managers Conectados
  socket.on("managers_conectados", async (data, response) => {
    const sockets = await io.fetchSockets();
    const managers = sockets
      .filter((s) => s.data.tipo == "manager")
      .map(s => s.data);
    response(managers);
  });

  socket.on("clientes_conectados", async (data, response) => {
    const sockets = await io.fetchSockets();
    const clientes = sockets
      .filter(s => s.data.tipo == "cliente")
      .map(s => s.data)
    response(clientes)
  })


  // Establece un nuevo Socket
  socket.on("nuevo", (data) => {
    socket.data = data
    socket.join(data.department);

    if (data.tipo == "cliente") {
      io.to(data.department).emit("nuevo_cliente_en_espera", data)
    }
  })

  socket.on("disconnecting", () => {
    io.emit("cliente_desconectado", socket.data.client);
  });
});



httpServer.listen(3000);

logger.info("Server Escuchando en el puerto 3000");
