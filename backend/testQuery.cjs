const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  
  // Test query with empty object in $and
  const docs = await db.collection('announcements').find({ $and: [{ status: 'active' }, {}] }).toArray();
  console.log("Docs with $and [status, {}]:", docs.length);
  
  // Test plain query
  const docs2 = await db.collection('announcements').find({ status: 'active' }).toArray();
  console.log("Docs with just status:", docs2.length);

  // Test history
  const historyDocs = await db.collection('announcements').find({ $and: [{ status: { $nin: ['active', 'scheduled'] } }, {}] }).toArray();
  console.log("Docs with history:", historyDocs.length);

  process.exit(0);
}
run();
