import express from "express";
import {
  createPost,
  deletePost,
  getPost,
  likeUnLikePost,
  replyToPost,
  getFeedsPost,
} from "../controllers/postControlers.js";
import protectRoute from "../middlewares/protectRoute.js";
const router = express.Router();

router.get("/feed", protectRoute, getFeedsPost);
router.get("/:postId", getPost);
router.post("/create", protectRoute, createPost);
router.delete("/:postId", protectRoute, deletePost);
router.post("/like/:id", protectRoute, likeUnLikePost);
router.post("/reply/:id", protectRoute, replyToPost);
export default router;
