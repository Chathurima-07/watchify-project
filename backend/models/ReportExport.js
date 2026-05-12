import mongoose from "mongoose";

const reportExportSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["student", "mentor", "system"], required: true },
    label: { type: String, required: true },
    rangeSummary: { type: String, default: "Snapshot" },
    sizeBytes: { type: Number, default: 0 },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("ReportExport", reportExportSchema);
