import { Server } from "socket.io";
import { Message } from "../models/message.model.js";

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  const userSockets = new Map(); // { userId: socketId}
  const userActivities = new Map(); // {userId: activity}

  io.on("connection", (socket) => {
    console.log("New client connected");

    // Thêm middleware đơn giản để xác thực qua query params
    const { userId } = socket.handshake.query;
    if (!userId) {
      console.log("No userId provided - disconnecting");
      return socket.disconnect();
    }

    socket.userId = userId;
    userSockets.set(userId, socket.id);
    userActivities.set(userId, "Online");

    // Gửi thông tin user mới kết nối
    io.emit("user_connected", userId);
    socket.emit("users_online", Array.from(userSockets.keys()));
    io.emit("activities", Array.from(userActivities.entries()));

    socket.on("update_activity", ({ userId, activity }) => {
      console.log("activity updated", userId, activity);
      userActivities.set(userId, activity);
      io.emit("activity_updated", { userId, activity });
    });

    socket.on("send_message", async (data) => {
      try {
        const { senderId, receiverId, content } = data;
        console.log("Received message:", data);

        const message = await Message.create({
          senderId,
          receiverId,
          content,
        });

        // Gửi tin nhắn dưới dạng plain object
        const messageData = {
          _id: message._id.toString(),
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          updatedAt: message.updatedAt.toISOString(),
        };

        const receiverSocketId = userSockets.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", messageData);
        }

        socket.emit("message_sent", messageData);
      } catch (error) {
        console.error("Message error:", error);
        socket.emit("message_error", error.message);
      }
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        userSockets.delete(socket.userId);
        userActivities.delete(socket.userId);
        io.emit("user_disconnected", socket.userId);
        console.log(`User ${socket.userId} disconnected`);
      }
    });
  });
};
