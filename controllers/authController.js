const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "24h" });
};

const register = async (req, res) => {
  try {
    const { name, password, role, phone, address } = req.body;

    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({ name, password, role, phone, address });
    await user.save();

    res.status(201).json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

      // admin login setup spicefic phone and password
  // admin login setup specific phone and password
if (
  phone === process.env.ADMIN_PHONE &&
  password === process.env.ADMIN_PASSWORD
) {
  try {
    // Define the token helper to receive a payload object instead
    const generateToken = (payload) => {
      return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });
    };

    return res.json({
      name: "Admin",
      role: "admin",
      // Pass both an ID placeholder and explicitly bake the role into the token
      token: generateToken({ id: "hardcoded_admin", role: "admin" }), 
    });
  } catch (error) {
    console.log("Admin Login Err", error);
    return res.status(401).json({ message: error.message });
  }
}


    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

  
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getProfile };
