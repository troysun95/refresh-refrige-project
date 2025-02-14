
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");


const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require('cors')
const express = require('express')
const app = express();


admin.initializeApp();

//CORS 允許網域
app.use(cors({
  origin: ['http://localhost:3000'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));


exports.getFilteredData = functions.https.onRequest(async (req, res) => {
  try {
    const { collectionPath, limitNumber, sortBy, descending, sortAfter  } = req.query;

    if (!collectionPath) {
      return res.status(400).json({ error: "Missing collectionPath" });
    }

    //加上 表頭等
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    const db = admin.firestore();
    const collectionRef = db.collection(collectionPath);


    let query = collectionRef.orderBy(sortBy, descending)

    if(sortAfter){
      query = query.startAfter(sortAfter)
    }

    //參照設定數字是定每次資料
    const limit = parseInt(limitNumber, 10)

    if(limit){
      query = query.limit(limit)
    }

    const snapshot = await query.get();
    const docs = snapshot.docs;
    //回傳資料
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    //判斷此次呼叫回傳 hasMore 必要
    const hasMore = snapshot.length === limit;
    const nextSortAfter = hasMore ? docs[docs.length - 1].get(sortBy) : null;

    return res.status(200).json({
      data,
      hasMore,
      sortAfter : nextSortAfter || undefined ,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
