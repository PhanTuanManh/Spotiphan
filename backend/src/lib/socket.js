// src/lib/socket.js

import { Server } from "socket.io";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  const userSockets = new Map(); // { userId: socketId}
  const userActivities = new Map(); // { userId: activity }

  io.on("connection", (socket) => {
    socket.on("user_connected", async (userId) => {
      userSockets.set(userId, socket.id);
      userActivities.set(userId, "Online");

      // Gửi danh sách người online cho người dùng mới
      socket.emit("users_online", Array.from(userSockets.keys()));

      // Thông báo cho mọi người biết người này đã online
      io.emit("user_connected", userId);
      io.emit("activities", Array.from(userActivities.entries()));

      console.log(`User ${userId} connected`);
    });

    /**
     * Cập nhật trạng thái hoạt động của người dùng (Typing, Listening, ...)
     */
    socket.on("update_activity", ({ userId, activity }) => {
      userActivities.set(userId, activity);
      io.emit("activity_updated", { userId, activity });
    });

    /**
     * Gửi tin nhắn giữa 2 người dùng
     */
    socket.on("send_message", async (data) => {
      try {
        const { senderId, receiverId, content } = data;

        // Kiểm tra nếu người gửi hoặc người nhận bị chặn
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        if (!sender || !receiver) {
          return socket.emit("message_error", "Người dùng không tồn tại");
        }

        if (receiver.isBlocked || sender.isBlocked) {
          return socket.emit("message_error", "Bạn không thể nhắn tin với người này");
        }

        const message = await Message.create({ senderId, receiverId, content });

        // Gửi tin nhắn đến người nhận nếu họ đang online
        const receiverSocketId = userSockets.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", message);
        }

        // Gửi tin nhắn đã gửi lại cho người gửi
        socket.emit("message_sent", message);
      } catch (error) {
        console.error("Message error:", error);
        socket.emit("message_error", error.message);
      }
    });

    /**
     * Cập nhật danh sách followers khi có sự thay đổi (Follow/Unfollow)
     */
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

    /**
     * Xử lý khi người dùng ngắt kết nối
     */
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
