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
      .map((s) => s.data);
    response(managers);
  });

  socket.on("clientes_conectados", async (data, response) => {
    const sockets = await io.fetchSockets();
    const clientes = sockets
      .filter((s) => s.data.tipo == "cliente")
      .map((s) => s.data);
    response(clientes);
  });

  // Establece un nuevo Socket
  socket.on("nuevo", (data) => {
    if (data) {
      socket.data = data;
      socket.data.socket_id = socket.id;
      socket.join(data.department);

      if (data.tipo == "cliente") {
        io.to(data.department).emit("nuevo_cliente_en_espera", data);
      }
    }
  });

  socket.on("remover_cliente", (data) => {
    io.to(data.socket_id).emit("cliente_removido");
  });

  socket.on("terminar_llamada",(client)=>{
    console.log(client);
    io.to(client.department).emit("socket_desconectado", client);
  })

  socket.on("disconnecting", async () => {
    const sockets = await io.fetchSockets();
    const sock = sockets.find((s) => s.id == socket.id);
    io.to(sock.data.department).emit("socket_desconectado", sock.data);
  });
});

httpServer.listen(3000);

logger.info("Server Escuchando en el puerto 3000");
