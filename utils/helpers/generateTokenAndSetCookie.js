import jwt from "jsonwebtoken";

const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });
  res.cookie("jwt", token, {
    httpOnly: true, //for security
    maxAge: 3 * 24 * 60 * 60 * 1000, //3d
    sameSite: "strict", //CSRF
  });
  return token;
};

export default generateTokenAndSetCookie;
