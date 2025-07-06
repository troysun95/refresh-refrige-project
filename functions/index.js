
const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();


const cors = require('cors')
const express = require('express');




const app = express();

// //CORS 允許網域
app.use(cors({
  origin: ['http://localhost:3000','https://troysun95.github.io'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.get('/getItemsOfStorageBySearch', async (req, res) => {
  try {
    const  { userId, storageId, limitNumber, input, lastSortValue } = req.query;

    if (!storageId || !input) {
      return res.status(400).json({ error: "Missing required query parameters!" });
      
    }

    // 取得 items collection
    const ref = admin.firestore().collection(`users/${userId}/items`);

    // 先過濾 storageId，再過濾 name
    let query = ref
      .where("storageId", "==", storageId)
      .where("name", "==", input)
      .orderBy("__name__")


    // 分頁處理
    if (lastSortValue && lastSortValue !== "null") {
      query = query.startAfter(lastSortValue);
    }

    const limit = parseInt(limitNumber, 10)
    query = query.limit(limit)

    // 查詢與回傳
    const snapshot = await query.get();
    const docs = snapshot.docs;
    const data = docs.map(doc => ({
      id: doc.id, ...doc.data()
    }));

    const hasMore = docs.length >  limit;
    const nextSortValue = hasMore ? docs[docs.length - 1].id : null;

    return res.status(200).json({
      data,
      hasMore,
      lastSortValue: nextSortValue,
    });
  } catch (error) {
    console.error("Error getting items from storage:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});


exports.api = onRequest(app);