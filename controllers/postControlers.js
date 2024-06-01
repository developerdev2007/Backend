import Post from "../models/postSchema.js";
import User from "../models/userModel.js";

const createPost = async (req, res) => {
  try {
    const { postedBy, text, img } = req.body;
    if (!postedBy || !text)
      return res
        .status(400)
        .json({ message: "postedBy and text fields are required" });

    const user = User.findById(postedBy);
    if (!user)
      return res.status(400).json({ message: "cannot find user on this id " });
    // if (user._id.toString() !== req.user._id.toString())
    //   res.status(401).json({ message: "Unauthorized to post" });
    const maxLength = 500;
    if (text.length > maxLength) {
      return res
        .status(401)
        .json({ message: `Text must be less then ${maxLength} characters` });
    }

    const newPost = new Post({
      postedBy,
      text,
      img,
    });
    await newPost.save();
    res
      .status(401)
      .json({ message: "new Post has been Successfully created", newPost });
  } catch (err) {
    console.log("error in Create POst ");
    res.status(500).json({ message: err.message });
  }
};

/////////get post
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.status(200).json({ post });
  } catch (err) {
    console.log("error in get Post ");
    res.status(500).json({ message: err.message });
  }
};

////////delete post////////

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.postedBy.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: "you can't delete others data" });
    }
    await Post.findByIdAndDelete(req.user._id);
    res.status(200).json({ message: "post deleted successfully" });
  } catch (err) {
    console.log("error in delete Post ");
    res.status(500).json({ message: err.message });
  }
};

const likeUnLikePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const userLikedPost = post.likes.includes(userId);

    if (userLikedPost) {
      // Unlike post
      await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
      res.status(200).json({ message: "Post unliked successfully" });
    } else {
      // Like post
      post.likes.push(userId);
      await post.save();
      res.status(200).json({ message: "Post liked successfully" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/////////////////reply

const replyToPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const userId = req.user._id;
    const userProfilePic = req.user.ProfilePic;
    const username = req.user.username;

    if (!text) return res.status(404).json({ error: "text is required" });

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const reply = { text, userId, userProfilePic, username };
    await post.replies.push(reply);
    await post.save();
    res
      .status(200)
      .json({ message: "Reply has been successfully added", post });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
////////////////////feed All posts
const getFeedsPost = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User is finded" });
    }
    const following = user.following;
    const feedPost = await Post.find({ postedBy: { $in: following } }).sort({
      createdAt: -1,
    });
    res.status(200).json({ feedPost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export {
  createPost,
  getPost,
  deletePost,
  likeUnLikePost,
  replyToPost,
  getFeedsPost,
};
