const { MongoClient, ServerApiVersion } = require('mongodb');

// Connection string จาก MongoDB Atlas
const uri = "mongodb+srv://thananchaipav66:auxn41utvOxwLfrc@cluster0.qj7yxt0.mongodb.net/plukrak?retryWrites=true&w=majority";

// Create a MongoClient
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function testConnection() {
    try {
        console.log('🔄 กำลังเชื่อมต่อ MongoDB Atlas...');
        
        // Connect to MongoDB
        await client.connect();
        
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("✅ Pinged your deployment. You successfully connected to MongoDB!");
        
        // ทดสอบการเขียนข้อมูล
        const db = client.db("plukrak");
        const collection = db.collection("test");
        
        const testDoc = {
            message: "Test connection",
            timestamp: new Date()
        };
        
        await collection.insertOne(testDoc);
        console.log("✅ ทดสอบการเขียนข้อมูลสำเร็จ!");
        
        // ทดสอบการอ่านข้อมูล
        const result = await collection.findOne({ message: "Test connection" });
        console.log("✅ ทดสอบการอ่านข้อมูลสำเร็จ:", result);
        
        // ลบข้อมูลทดสอบ
        await collection.deleteOne({ message: "Test connection" });
        console.log("✅ ลบข้อมูลทดสอบแล้ว");
        
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
        console.log("🔌 ปิดการเชื่อมต่อแล้ว");
    }
}

// Run the test
testConnection().catch(console.dir); 