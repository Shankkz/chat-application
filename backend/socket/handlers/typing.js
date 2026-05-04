/**
 * TypingManager — tracks per-conversation typing state with auto-stop timeout.
 */
class TypingManager {
  constructor(io) {
    this.io = io;
    this.timers = new Map(); // key: `${senderId}:${receiverId}`
  }

  _key(senderId, receiverId) {
    return `${senderId}:${receiverId}`;
  }

  async startTyping(senderId, receiverId, getSocketId) {
    const receiverSocketId = await getSocketId(receiverId);
    if (!receiverSocketId) return;

    const key = this._key(senderId, receiverId);

    // Clear existing auto-stop timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    this.io.to(receiverSocketId).emit('typing', { senderId });

    // Auto-stop after 3s of inactivity
    const timer = setTimeout(() => {
      this.stopTyping(senderId, receiverId, getSocketId);
    }, 3000);

    this.timers.set(key, timer);
  }

  async stopTyping(senderId, receiverId, getSocketId) {
    const key = this._key(senderId, receiverId);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }

    const receiverSocketId = await getSocketId(receiverId);
    if (receiverSocketId) {
      this.io.to(receiverSocketId).emit('stop_typing', { senderId });
    }
  }
}

module.exports = TypingManager;
