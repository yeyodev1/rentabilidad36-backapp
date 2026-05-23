import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model";

export async function register(req: Request, res: Response) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: "Name, email, and password are required" });
    return;
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(409).json({ message: "Email already registered" });
    return;
  }

  const user = new User({ name, email, password });
  await user.save();

  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET as string,
    { expiresIn: "30d" }
  );

  res.status(201).json({
    message: "User registered successfully",
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401).json({ message: "Invalid credentials" });
    return;
  }

  const token = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET as string,
    { expiresIn: "30d" }
  );

  res.json({
    message: "Login successful",
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
}
