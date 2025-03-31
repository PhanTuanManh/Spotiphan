// backend/src/lib/socket.js
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

    const { clerkId } = socket.handshake.query; // Đổi thành clerkId
    if (!clerkId) {
      console.log("No clerkId provided - disconnecting");
      return socket.disconnect();
    }

    socket.clerkId = clerkId; // Lưu clerkId
    userSockets.set(clerkId, socket.id);
    userActivities.set(clerkId, "Online");

    // Gửi thông tin user mới kết nối
    io.emit("user_connected", clerkId);
    socket.emit("users_online", Array.from(userSockets.keys()));
    io.emit("activities", Array.from(userActivities.entries()));

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

    socket.on("update_activity", ({ userId, activity }) => {
      console.log("activity updated received from client:", userId, activity);
      if (!userId || !activity) {
        console.error("Invalid activity update:", { userId, activity });
        return;
      }

      userActivities.set(userId, activity);
      console.log("Broadcasting activity update to all clients");
      io.emit("activity_updated", { userId, activity });
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
