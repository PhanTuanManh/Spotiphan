//src/middleware/auth.middleware.js

import { clerkClient } from "@clerk/express";
import { User } from "../models/user.model.js";

export const authenticate = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    const clerkUser = await clerkClient.users.getUser(req.auth.userId);
    const user = await User.findOneAndUpdate(
      { clerkId: clerkUser.id },
      {
        $setOnInsert: {
          fullName: `${clerkUser.firstName} ${clerkUser.lastName}`.trim(),
          email: clerkUser.emailAddresses[0]?.emailAddress,
          imageUrl: clerkUser.imageUrl,
          role: "free",
        },
      },
      { upsert: true, new: true }
    );

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};
