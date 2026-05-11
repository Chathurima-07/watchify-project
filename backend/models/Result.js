import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
    },
    score: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Ongoing", "Completed"],
      default: "Ongoing",
    },
    violations: [
      {
        type: { type: String }, // e.g., "Tab Switch", "Exit Fullscreen"
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Result", resultSchema);