import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import Post from '../models/postSchema.js'

/////////////////////////////////////////////

const signupUser = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;
    const user = await User.findOne({ $or: [{ email }, { username }] });

    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      username,
      password: hashedPassword,
    });
    await newUser.save();

    if (newUser) {
      generateTokenAndSetCookie(newUser._id, res);

      res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        username: newUser.username,
        bio: newUser.bio,
        profilePic: newUser.profilePic,
        message: "user has been successfuly created",
      });
    } else {
      res.status(400).json({ error: "Invalid user data" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("Error in signupUser: ", err.message);
  }
};

/////////////////////login

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user?.password || ""
    );
    if (!user || !isPasswordCorrect)
      return res.status(400).json({ error: "invalid username or password" });

    generateTokenAndSetCookie(user._id, res);
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      bio: user.bio,
      profilePic: user.profilePic,
      message: "user Has been successfully ",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("Error in login: ", err.message);
  }
};
/////////////////////logOut

const logoutUser = async (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 1 });
    res.status(200).json({ message: "user has been log out successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("Error in logOut: ", err.message);
  }
};

const followUnFollow = async (req, res) => {
  try {
    const { id } = req.params;
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);
    if (id === req.user._id.toString())
      return res
        .status(400)
        .json({ error: "you cant FOLLOW / un follow your self" });

    if (!userToModify || !currentUser)
      return res.status(400).json({ error: "User not found" });
    const isFollowing = currentUser.following.includes(id);
    if (isFollowing) {
      ///unfollow
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      res.status(200).json({ message: "User unfollowed" });
    } else {
      //follow
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      res.status(200).json({ message: "User followed" });
    }
  } catch (err) {
    console.log("Error in Follow/Unfollow user: ", err.message);
    res.status(500).json({ error: err.message });
  }
};
/////////////update
const updateUser = async (req, res) => {
  const { name, username, email, bio } = req.body;
  let { profilePic,password } = req.body;
  const userId = req.user._id;
  try {
    let user = await User.findById(req.user._id);
    if (!user) return res.status(400).json({ error: "cant find user" });
    if (req.params.id !== userId.toString())
      return res
        .status(400)
        .json({ error: "cant edit profile of another user" });

    if (password) {
      const salt = bcrypt.genSalt(10);
      const hashedPassword =await bcrypt.hash(password, salt);
      user.password = hashedPassword;
    }
    if (profilePic) {
      if (user.profilePic) {
        await cloudinary.uploader.destroy(
          //delete old pic
          user.profilePic.split("/").pop().split(".")[0]
        );
      }
      const uploadedResponse = await cloudinary.uploader.upload(profilePic);
      ///reinitialization of profile pic
      profilePic = uploadedResponse.secure_url;
    }

    user.name = name || user.name;
    user.username = username || user.username;
    user.email = email || user.email;
    user.profilePic = profilePic || user.profilePic;
    user.bio = bio || user.bio;
    user = await user.save();
    /////updating posts that has user replie
    await Post.updateMany(
      { "replies.userId": userId }, {
        $set: {
          "replies.$[reply].username ":user.username,
          "replies.$[reply].userProfilePic ":user.profilePic,
        },
      },{arrayFilters:[{"reply.userId":userId}]}
)



    ///user password should be null in response
    user.password = null;
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("Error in Update user: ", err.message);
  }
};
////////////////


/////////////////profile
const getUserProfile = async (req, res) => {
  //query can either be userId or username
  const { query } = req.params;
  let user;
  try {
  if(mongoose.Types.ObjectId.isValid(query)) {
    //query is userId
     user = await User.findOne({_id:query}).select("-password").select("-updatedAt")
  }else{
    //query is username
     user = await User.findOne({ username: query })
      .select("-password")
      .select("-updatedAt");
  }

    if (!user) return res.status(400).json({ error: "cant find user" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("Error in getUserProfile user: ", err.message);
  }
};
export {
  signupUser,
  loginUser,
  logoutUser,
  followUnFollow,
  updateUser,
  getUserProfile,
};
