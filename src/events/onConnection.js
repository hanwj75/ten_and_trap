export const onConnection = (socket) => {
  console.log(`Client connected from ${socket.remoteAddress}:${socket.remotePort}`);

  socket.on('data', onData(socket));

  socket.on('end', onEnd(socket));

  socket.on('error', onError(socket));
};
