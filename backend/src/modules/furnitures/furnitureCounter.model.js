import mongoose from "mongoose";

const furnitureCounterSchema = new mongoose.Schema({
  prefix: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  sequence: {
    type: Number,
    default: 0
  }
});

const FurnitureCounter = mongoose.model("FurnitureCounter", furnitureCounterSchema);
export default FurnitureCounter;
