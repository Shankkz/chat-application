const { getSocketId } = require('../presence');

module.exports = (io, socket) => {
  socket.on('call_user', async ({ userToCall, signalData, from }) => {
    const receiverSocketId = await getSocketId(userToCall);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('incoming_call', { signal: signalData, from });
    }
  });

  socket.on('answer_call', async ({ to, signal }) => {
    const callerSocketId = await getSocketId(to);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call_accepted', signal);
    }
  });

  socket.on('ice_candidate', async ({ to, candidate }) => {
    const receiverSocketId = await getSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('ice_candidate', candidate);
    }
  });

  socket.on('end_call', async ({ to }) => {
    const receiverSocketId = await getSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('call_ended');
    }
  });
};
