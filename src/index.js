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
  socket.on("nuevo_cliente", (client) => {
    socket.data.client = client;
    logger.info(`Nuevo Cliente...`);
    logger.info(client);
  });

  socket.on("nuevo_manager", (manager) => {
    socket.data.manager = manager;
    logger.info(`Nuevo Manager...`);
    logger.info(manager);
  });

  //   Devuelve los clientes Conectados
  socket.on("clientes_conectados", async (data, response) => {
    const sockets = await io.fetchSockets();
    const clientes = sockets
      .filter((s) => s.id != socket.id)
      .map((s) => s.data.client);
    response(clientes);
  });

  //   Devuelve los Managers Conectados
  socket.on("managers_conectados", async (data, response) => {
    const sockets = await io.fetchSockets();
    const managers = sockets
      .filter((s) => s.id != socket.id)
      .map((s) => s.data.manager);
    response(managers);
  });

  socket.on("disconnecting", () => {
    io.emit("cliente_desconectado", socket.data.client);
  });
});

httpServer.listen(3000);

logger.info("Server Escuchando en el puerto 3000");
