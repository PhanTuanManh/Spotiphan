// src/routes/search.route.js
import { Router } from "express";
import { searchAll } from "../controller/search.controller.js";

const router = Router();

// GET /api/search?q=query&page=1&limit=10&type=songs|albums|playlists|users
router.get("/", searchAll);

export default router;
