import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

// A look that has been put in front of voters (an outfit from the style engine), kept so results can show it later.
const fitLookSchema = new Schema(
  {
    key: { type: String, required: true, unique: true }, // hash of the sorted slugs
    slugs: { type: [String], required: true },
    mood: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// One vote in a head-to-head. A customer can vote once per pair.
const fitVoteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    pairKey: { type: String, required: true },
    winnerKey: { type: String, required: true, index: true },
    loserKey: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
fitVoteSchema.index({ userId: 1, pairKey: 1 }, { unique: true });
fitVoteSchema.index({ createdAt: -1 });

// A crew pools its members' spending for group discounts.
const crewSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 24 },
    code: { type: String, required: true, unique: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [Schema.Types.ObjectId], ref: "User", default: [] },
    // Which member already took which tier's coupon.
    claimed: { type: [{ userId: Schema.Types.ObjectId, tier: Number }], default: [] },
  },
  { timestamps: true },
);
crewSchema.index({ members: 1 });

// Live drop chat. Messages expire after three days.
const liveMessageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, maxlength: 40 },
    text: { type: String, required: true, maxlength: 200 },
    createdAt: { type: Date, default: Date.now, expires: 3 * 24 * 3600 },
  },
  { versionKey: false },
);

export type FitLookDoc = InferSchemaType<typeof fitLookSchema>;
export type CrewDoc = InferSchemaType<typeof crewSchema>;
export const FitLook: Model<FitLookDoc> = (mongoose.models.FitLook as Model<FitLookDoc>) ?? mongoose.model<FitLookDoc>("FitLook", fitLookSchema);
export const FitVote = (mongoose.models.FitVote as Model<InferSchemaType<typeof fitVoteSchema>>) ?? mongoose.model("FitVote", fitVoteSchema);
export const Crew: Model<CrewDoc> = (mongoose.models.Crew as Model<CrewDoc>) ?? mongoose.model<CrewDoc>("Crew", crewSchema);
export const LiveMessage = (mongoose.models.LiveMessage as Model<InferSchemaType<typeof liveMessageSchema>>) ?? mongoose.model("LiveMessage", liveMessageSchema);
