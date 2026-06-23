import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const UserSchema = new mongoose.Schema({ email: String });
const User = mongoose.models.User || mongoose.model("User", UserSchema, "users");

async function run() {
  await mongoose.connect(process.env.DB_URI as string);
  console.log("Connected to DB");
  const res = await User.deleteOne({ email: "dreyes@bakano.ec" });
  console.log("Deleted:", res.deletedCount);
  await mongoose.disconnect();
}

run().catch(console.error);
