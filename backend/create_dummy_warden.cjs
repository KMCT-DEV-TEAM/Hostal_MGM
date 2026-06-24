const mongoose = require('mongoose');
const dns = require('dns');

// Fix DNS
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const uri = "mongodb+srv://KMT_HOSTAL:kmct123@cluster0.vx82raf.mongodb.net/?appName=Cluster0";

async function run() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;

    // Create a dummy warden user
    const dummyWarden = {
      name: "Dummy Warden",
      email: "dummywarden@example.com",
      phone: "+91 9999999999",
      role: "warden",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const res = await db.collection('users').insertOne(dummyWarden);
    console.log("Inserted dummy warden:", res.insertedId);

    // Also link to a hostel if needed, or just leave hostel null
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
