// src/routes/admin.routes.js

import { Router } from "express";
import {
  approveAlbum,
  approveSingleOrEP,
  archiveSingleOrEP,
  checkAdmin,
  createSubscriptionPlan,
  createUser,
  deleteSingleOrEP,
  deleteSubscriptionPlan,
  deleteUser,
  getAllAlbums,
  getAllSinglesOrEPs,
  getAllSubscriptionPlans,
  getAllUsers,
  rejectAlbum,
  rejectSingleOrEP,
  toggleBlockUser,
  updateSubscriptionPlan,
} from "../controller/admin.controller.js";
import {
  createAdvertisement,
  deleteAdvertisement,
  getAllAdvertisements,
  toggleAdvertisementActive,
  updateAdvertisement,
} from "../controller/advertisement.controller.js";
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  updateCategory,
} from "../controller/category.controller.js";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.use(requireAdmin);

// **check admin**
router.get("/check", checkAdmin);

// **Quản lý Single/EP**
router.put("/singles/:songId/approve", approveSingleOrEP);
router.put("/singles/:songId/reject", rejectSingleOrEP);
router.get("/singles", getAllSinglesOrEPs);
router.post("/singles/:songId/archive", archiveSingleOrEP);
router.delete("/singles/:songId", deleteSingleOrEP);

// **Quản lý Album**
router.put("/albums/:albumId/approve", approveAlbum);
router.put("/albums/:albumId/reject", rejectAlbum);
router.get("/albums", getAllAlbums);

// **Quản lý User**
router.post("/users", createUser);
router.get("/users", getAllUsers);
router.delete("/users/:userId", deleteUser);
router.put("/users/:userId/toggle-block", toggleBlockUser);

// **Quản lý Subscription Plans**
router.post("/subscriptions", createSubscriptionPlan);
router.delete("/subscriptions/:id", deleteSubscriptionPlan);
router.put("/subscriptions/:id", updateSubscriptionPlan);
router.get("/subscriptions", getAllSubscriptionPlans);

// **Quản lý Quảng cáo**
router.get("/advertisements", getAllAdvertisements);
router.post("/advertisements", createAdvertisement);
router.delete("/advertisements/:id", deleteAdvertisement);
router.put("/advertisements/:id", updateAdvertisement);
router.put("/advertisements/:id/toggle-active", toggleAdvertisementActive);

// **Quản lý category
router.post("/categories/", createCategory);
router.get("/categories/:categoryId", getCategoryById);
router.put("/categories/:categoryId", updateCategory);
router.delete("/categories/:categoryId", deleteCategory);

export default router;
