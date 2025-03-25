// backend/src/lib/socket.js

import { Server } from "socket.io";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { verifyToken } from "@clerk/express";

let io; // Declare io globally

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const { userId } = await verifyToken(token);
      socket.userId = userId;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
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

    socket.on("toggle_like", async ({ songId, userId }) => {
      try {
        const user = await User.findOne({ clerkId: userId });
        const song = await Song.findById(songId);

        if (!user || !song) {
          return socket.emit("toggle_like_error", "User or song not found");
        }

        const isLiked = user.likedSongs.includes(songId);

        if (isLiked) {
          // Nếu đã thích, bỏ thích
          user.likedSongs = user.likedSongs.filter(
            (id) => id.toString() !== songId
          );
          song.likes = song.likes.filter(
            (id) => id.toString() !== user._id.toString()
          );
        } else {
          // Nếu chưa thích, thêm vào danh sách thích
          user.likedSongs.push(songId);
          song.likes.push(user._id);
        }

        await user.save();
        await song.save();

        // Gửi sự kiện cập nhật like/unlike cho tất cả client
        io.emit("like_toggled", { songId, userId, isLiked: !isLiked });

        socket.emit("toggle_like_success", { songId, isLiked: !isLiked });
      } catch (error) {
        console.error("Error toggling like:", error);
        socket.emit("toggle_like_error", error.message);
      }
    });

    socket.on("send_message", async (data) => {
      try {
        const { senderId, receiverId, content } = data;

        const message = await Message.create({
          senderId,
          receiverId,
          content,
        });

        // send to receiver in realtime, if they're online
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
          return socket.emit(
            "update_followers_error",
            "Người dùng không tồn tại"
          );
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
