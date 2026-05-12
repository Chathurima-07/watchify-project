import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "mentor", "student"],
      default: "student",
    },
    /** Only enforced for role mentor (login + API access). */
    mentorStatus: {
      type: String,
      enum: ["active", "disabled"],
      default: "active",
    },
    flagged: { type: Boolean, default: false },
    flagReason: { type: String, default: "" },
    flagSeverity: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
    flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    flaggedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);