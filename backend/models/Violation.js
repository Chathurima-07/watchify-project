import mongoose from "mongoose";

const violationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true }, // e.g. "TAB_SWITCH"
    severity: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    description: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Violation", violationSchema);

