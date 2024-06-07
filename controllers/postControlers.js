import Post from "../models/postSchema.js";
import User from "../models/userModel.js";
import {v2 as cloudinary} from "cloudinary";

const createPost = async (req, res) => {
  try {
    const { postedBy, text } = req.body;
    let { img } = req.body;
    if (!postedBy || !text)
      return res
        .status(400)
        .json({ error: "postedBy and text fields are required" });

    const user = User.findById(postedBy);
    if (!user)
      return res.status(400).json({ error: "cannot find user on this id " });
    // if (user._id.toString() !== req.user._id.toString())
    //   res.status(401).json({ message: "Unauthorized to post" });
    const maxLength = 500;
    if (text.length > maxLength) {
      return res
        .status(401)
        .json({ error: `Text must be less then ${maxLength} characters` });
    }
    if(img){
     
        const uploadedResponse = await cloudinary.uploader.upload(img);
        ///reinitialization of post pic
        img = uploadedResponse.secure_url;
      
    }

    const newPost = new Post({
      postedBy,
      text,
      img,
    });
    await newPost.save();
    res
      .status(201)
      .json( newPost );
  } catch (err) {
    console.log("error in Create POst ");
    res.status(500).json({ message: err.message });
  }
};

/////////get post
const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });
    res.status(200).json(post);
  } catch (err) {
    console.log("error in get Post ");
    res.status(500).json({ error: err.message });
  }
};

////////delete post////////

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.postedBy.toString() !== req.user._id.toString()) {
      return res.status(400).json({ error: "you can't delete others data" });
    } if (post.img) {
      const imgId = post.img.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(imgId);
    }
    await Post.findByIdAndDelete(req.params.postId);
    res.status(200).json({ message: "post deleted successfully" });
  } catch (err) {
    console.log("error in delete Post ");
    res.status(500).json({ error: err.message });
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
    const userProfilePic = req.user.profilePic;
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
      .json(reply);
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
      return res.status(404).json({ error: "User is finded" });
    }
    const following = user.following;
    const feedPost = await Post.find({ postedBy: { $in: following } }).sort({
      createdAt: -1,
    });
    res.status(200).json( feedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getUserPosts = async (req, res) => {
  const {username} = req.params;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User is finded" });
    }
    const posts = await Post.find({ postedBy: user._id }).sort({
          createdAt: -1,
    });
    res.status(200).json(posts);
  } catch (error) {
    
  }
  
}

export {
  createPost,
  getPost,
  deletePost,
  likeUnLikePost,
  replyToPost,
  getFeedsPost,
  getUserPosts,
};
