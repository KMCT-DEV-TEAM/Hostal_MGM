import app from "./app.js";
import connectDB from "./config/db.js";

// force nodemon restart batch 3
const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// ..