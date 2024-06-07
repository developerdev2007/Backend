import express from "express";
import {
  createPost,
  deletePost,
  getPost,
  likeUnLikePost,
  replyToPost,
  getFeedsPost,
  getUserPosts,
} from "../controllers/postControlers.js";
import protectRoute from "../middlewares/protectRoute.js";
const router = express.Router();

router.get("/feed", protectRoute, getFeedsPost);
router.get("/:postId", getPost);
router.get("/user/:username", getUserPosts);
router.post("/create", protectRoute, createPost);
router.delete("/:postId", protectRoute, deletePost);
router.put("/like/:id", protectRoute, likeUnLikePost);
router.put("/reply/:id", protectRoute, replyToPost);
export default router;
