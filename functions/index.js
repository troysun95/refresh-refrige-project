
const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");


const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require('cors')
const express = require('express');
//const { orderBy, collection } = require("firebase/firestore");
const app = express();


admin.initializeApp();

// //CORS 允許網域
app.use(cors({
  origin: ['http://localhost:3000'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// //讀取
// exports.getFilteredData = functions.https.onRequest(async (req, res) => {
//   try {
//     const { collectionPath, limitNumber, sortBy, descending, sortAfter } = req.query;

//     console.log("query by sortBy,", sortBy);

//     if (!collectionPath) {
//       return res.status(400).json({ error: "Missing collectionPath" });
//     }

//     res.set("Access-Control-Allow-Origin", "http://localhost:3000");
//     res.set("Access-Control-Allow-Methods", "GET");
//     res.set("Access-Control-Allow-Headers", "Content-Type");

//     const db = admin.firestore();
//     const collectionRef = db.collection(collectionPath);

//     let query = collectionRef.orderBy(sortBy, descending === "desc" ? "desc" : "asc");

//     // sortAfter
//     if (sortAfter) {
//       let parsedSortAfter = JSON.parse(sortAfter); 
//       if (parsedSortAfter._seconds !== undefined && parsedSortAfter._nanoseconds !== undefined) {
//         const sortAfterTimestamp = new admin.firestore.Timestamp(
//           parsedSortAfter._seconds,
//           parsedSortAfter._nanoseconds
//         );

//         query = query.startAfter(sortAfterTimestamp);
//         console.log("使用 startAfter Timestamp:", sortAfterTimestamp);
//       }
//     }

//     const limit = parseInt(limitNumber, 10);
//     if (limit) {
//       query = query.limit(limit);
//     }

//     const snapshot = await query.get();
//     const docs = snapshot.docs;
//     const data = docs.map((doc) => ({ id: doc.id, ...doc.data() }));

//     const hasMore = docs.length >= limit;
//     const nextSortAfter = hasMore ? docs[docs.length - 1].get(sortBy) : null;

//     return res.status(200).json({
//       data,
//       hasMore,
//       sortAfter: nextSortAfter,
//     });
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// });


// //讀取排序：created_at , id
// // exports.getItemsInStorageCollection = functions.https.onRequest(async (req, res) => {
// //   try {
// //     const { collectionPath, limitNumber, sortBy, descending, sortAfter } = req.query;
// //     //const collectionPath = `users/${userId}/storageCollection/${storageId}/items`;
// //     const collectionRef = admin.firestore().collection(collectionPath);

// //     const querySnapshot = await collectionRef
// //       .orderBy('created_at', 'desc') // 使用單欄位索引排序 created_at
// //       .limit(10)
// //       .get();

// //     const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

// //     return res.status(200).json({ data: items });

// //   } catch (error) {
// //     console.error("Error fetching items: ", error);
// //     return res.status(500).send("Error fetching items");
// //   }
// // });

// //搜尋: 
// // storage 資料
exports.getItemsOfStorageBySearch = functions.https.onRequest(async (req, res) => {
  try {
    const { 
      storageId, limitNumber, searchBy , input, 
      lastSortValue, sortBy, durationTimeStamp
    } = req.query;

      
    //加上 表頭等
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    const itemsRef = admin.firestore().collection("items")

    let query = itemsRef
      .where("storageId", "==", storageId)
      //name, notes
      .where(searchBy, "==", input)
      //預設為 建立日期 , 一週內
      .where(sortBy, ">=", durationTimeStamp)
      .orderBy(sortBy, "desc")
      .orderBy(admin.firestore.FieldPath.documentId());

    if (lastSortValue) {
      const parsedLastValue =  JSON.parse(lastSortValue) 

      if(
        parsedLastValue[sortBy] && 
        parsedLastValue[sortBy]._seconds &&
        parsedLastValue[sortBy]._nanoseconds
      ){
        const lastValueTimeStamp = new admin.firestore.Timestamp(
          parseInt(parsedLastValue[sortBy]._seconds, 10),
          parseInt(parsedLastValue[sortBy]._nanoseconds, 10)
        );
        query = query.startAfter(lastValueTimeStamp, parsedLastValue.__name__);
      }else{
        return res.status(400).json({error: "Invalid lastSortValue"})
      }
    }
    
    const limit = parseInt(limitNumber, 10)

    if(limit){
      query = query.limit(limit)
    }

    const snapshot = await query.get();
    const docs = snapshot.docs;

    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const hasMore = docs.length === limit;
    const nextSortValue = hasMore ? {
      [sortBy]: docs[docs.length - 1].get(sortBy),
      __name__ : docs[docs.length - 1].id,
    } : null;

    return res.status(200).json({
      data,
      hasMore,
      lastSortValue : nextSortValue ,
    });
  } catch (error) {
    console.error("Error getting items from storage:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

//TODO: 搜尋所有 items

exports.getItemsBySearch = functions.https.onRequest(async(req, res)=>{

  try {
    
  } catch (error) {
    
  }
})

exports.getExpiredStorageItems = functions.https.onRequest(async(req, res)=>{

  try {
    const {
      storageId, limitNumber, expiredTimeStamp, lastSortValue, 
    } = req.query

    //表頭
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    const itemsRef = admin.firestore().collection("items")
    
    
    let query = itemsRef
      .where("storageId", "==", storageId)
      .where("expired_date", "<=", expiredTimeStamp)
      .orderBy("expired_date", 'desc')
      .orderBy("__name__", "desc")

    //讀取數量
    const totalCount = await itemsRef
      .where("storageId", "==", storageId)
      .where("expired_date", "<=", expiredTimeStamp)
      .orderBy("expired_date", 'desc')
      .orderBy("__name__", "desc")
      .count().get()
    
    //讀取資料
    if(lastSortValue){
      const parsedLastValue = JSON.parse(lastSortValue)

      if(
        parsedLastValue &&
        parsedLastValue.expired_date._seconds &&
        parsedLastValue.expired_date._nanoseconds
      ){
        const lastValueTimeStamp = new admin.firestore.Timestamp(
          parseInt(parsedLastValue.expired_date._seconds, 10),
          parseInt(parsedLastValue.expired_date._nanoseconds, 10)
        );
        query = query.startAfter(lastValueTimeStamp, parsedLastValue.__name__);
      }else{

        return res.status(400).json({error: "Invalid lastSortValue"})
      }
    }

    const limit = parseInt(limitNumber, 10)

    if(limit){
      query = query.limit(limit)
    }

    const snapshot  = await query.get()
    console.log("Snapshot type:", typeof snapshot); 
    console.log("Snapshot:", snapshot); 
    console.log('snapshot.docs()', snapshot.docs())
    const docs = snapshot.docs();

    if(docs.length === 0){
      console.log('無符合過期項目')
      return res.status(200).json({
        data: [],
        hasMore: false,
        lastSortValue: null,
        totalCount: 0,
      });
    }

    const data = docs.map((doc)=>({
      id: doc.id,
      ...doc.data()
    }))

    const hasMore = docs.length === limit ;
    const nextSortValue = hasMore ? {
      expired_date: docs[docs.length - 1].get("expired_date"),
      __name__ : docs[docs.length - 1].id,
    } : null;

    return res.status(200).json({
      data,
      hasMore,
      lastSortValue : nextSortValue ,
      totalCount: totalCount.data().count,
    });

  } catch (error) {
    console.error("Error getting expired items", error)
    return res.status(500).json({error: "Internal Server Error"})
  }
})

