// src/lib/socket.js

import { Server } from "socket.io";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";

let io; // Declare io globally

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  const userSockets = new Map();
  const userActivities = new Map();

  io.on("connection", (socket) => {
    socket.on("user_connected", async (userId) => {
      userSockets.set(userId, socket.id);
      userActivities.set(userId, "Online");

      socket.emit("users_online", Array.from(userSockets.keys()));
      io.emit("user_connected", userId);
      io.emit("activities", Array.from(userActivities.entries()));

      console.log(`User ${userId} connected`);
    });

    socket.on("update_activity", ({ userId, activity }) => {
      userActivities.set(userId, activity);
      io.emit("activity_updated", { userId, activity });
    });

    socket.on("send_message", async (data) => {
      try {
        const { senderId, receiverId, content } = data;
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (!sender || !receiver) {
          return socket.emit("message_error", "Người dùng không tồn tại");
        }

        if (receiver.isBlocked || sender.isBlocked) {
          return socket.emit("message_error", "Bạn không thể nhắn tin với người này");
        }

        const message = await Message.create({ senderId, receiverId, content });

        const receiverSocketId = userSockets.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", message);
        }

        socket.emit("message_sent", message);
      } catch (error) {
        console.error("Message error:", error);
        socket.emit("message_error", error.message);
      }
    });

    socket.on("update_followers", async ({ userId }) => {
      try {
        const user = await User.findById(userId).populate("followers");

        if (!user) {
          return socket.emit("update_followers_error", "Người dùng không tồn tại");
        }

        io.emit("followers_updated", {
          userId,
          followers: user.followers.map((f) => f._id),
        });
      } catch (error) {
        console.error("Update followers error:", error);
      }
    });

    socket.on("disconnect", () => {
      let disconnectedUserId;
      for (const [userId, socketId] of userSockets.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          userSockets.delete(userId);
          userActivities.delete(userId);
          break;
        }
      }

      if (disconnectedUserId) {
        io.emit("user_disconnected", disconnectedUserId);
        console.log(`User ${disconnectedUserId} disconnected`);
      }
    });
  });
};

// ✅ Export io so it can be used in other files
export { io };
