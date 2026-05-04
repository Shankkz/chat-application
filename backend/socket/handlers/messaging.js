const { getSocketId } = require('../presence');

module.exports = (io, socket) => {
  socket.on('send_message', async (data) => {
    const [receiverSocketId, senderSocketId] = await Promise.all([
      getSocketId(data.receiver),
      getSocketId(data.sender),
    ]);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive_message', data);
    }

    // Sync to sender's other devices if open in multiple tabs
    if (senderSocketId && senderSocketId !== socket.id) {
      io.to(senderSocketId).emit('receive_message', data);
    }
  });

  socket.on('message_status_update', async (data) => {
    const senderSocketId = await getSocketId(data.senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit('message_status_update', data);
    }
  });
};
