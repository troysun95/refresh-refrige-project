import { 
  deleteDoc, onSnapshot,orderBy,
  startAfter,limit
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { 
  deleteUser,
  getAuth, 
  GoogleAuthProvider,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { collection,  getFirestore, setDoc, doc ,getDoc, getDocs, updateDoc, query, where,
  addDoc, 
} from "firebase/firestore";
import Swal from "sweetalert2";
import axios from "axios";
import { getDurationTimeStamp } from "../fn";

// 環境變數設定
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)
export const auth = getAuth(app);
export const provide = new GoogleAuthProvider();

//claud functions 路徑

//監聽網址，條證 firebase functions 路徑

const isLocal = window.location.hostname === "localhost"
const baseURL = isLocal 
? "http://localhost:5001/test-demo1026/us-central1"
: "https://us-central1-test-demo1026.cloudfunctions.net"

const axiosInstance = axios.create({
  baseURL: baseURL,
})



//通用
const checkIsUserValid = (user)=>{
  if(!user){
    Swal.fire({
      title:"使用者資訊非有效值",
      icon:"error"
    })
    return
  }
}


// const checkIsDatabaseExist = async(checkDocRef, databaseName)=>{
//   const docSnap = await getDoc(checkDocRef)
//   if(docSnap.exists()){
//     throw new Error(`資料庫 ${databaseName}已經存在，勿新增以免覆蓋`)
//   }
// }

const checkIsDocExist =async(docRef)=>{
  const docSnap = await getDoc(docRef)
  let isExist = true;
  if(!docSnap.exists()){
    isExist = false
  }
  return isExist
}

//後端資料
//TODO 
// export const fetchFilterData = async (
//   user, 
//   storageId, 
//   limitNumber = 0,
//   sortBy, 
//   descending,
//   sortAfter = null,
// ) => {
//   try {
//     const userId = user.uid;
//     const collectionPath = `users/${userId}/storageCollection/${storageId}/items`; 

//     let formattedSortAfter = null;
//     if (sortAfter) {
//       if (sortAfter instanceof Object && sortAfter.seconds !== undefined) {
//         formattedSortAfter = JSON.stringify({
//           _seconds: sortAfter.seconds,
//           _nanoseconds: sortAfter.nanoseconds
//         });
//       } else {
//         formattedSortAfter = JSON.stringify(sortAfter);
//       }
//       console.log("透過 sortAfter 呼叫", formattedSortAfter);
//     }

//     const params = {
//       collectionPath: collectionPath,
//       limitNumber: limitNumber,
//       sortBy: sortBy,
//       descending: descending ? "desc" : "asc",
//       sortAfter: formattedSortAfter, 
//     };

//     const response = await axiosInstance.get("/getFilteredData", { params });

//     console.log("fetchFilterData 成功！", response.data);
//     return {
//       data: response.data.data,
//       hasMore: response.data.hasMore,
//       sortAfter: response.data.sortAfter, 
//     };
//   } catch (error) {
//     console.error("failed to fetch filter data", error);
//     return null;
//   }
// };



//Search stroage items
export const fetchStorageSearchData =async(
  user, 
  storageId,
  limitNumber,
  searchBy,
  descending,
  sortOfTime,
  duration, 
  input = null,
  sortAfter = null
)=>{
  try {
    if(!duration){
      throw new Error("時間範圍輸入不符合規範") 
    }
    if(sortAfter){
      console.log("沒有傳入 sortAfter")
    }
    const userId = user.uid;
    const collectionPath = `users/${userId}/storageCollection/${storageId}/items`; 
    const durationTimeStamp = getDurationTimeStamp(duration)
    const params = {
      collectionPath: collectionPath,
      limitNumber :limitNumber,
      searchBy: searchBy,
      descending: descending ? "desc" : "asc",
      sortOfTime : sortOfTime,
      durationTimeStamp : durationTimeStamp, 
      input : input, 
      sortAfter : sortAfter,
    }
    const response = await axiosInstance.get("/getStorageDataBySearch",{
      params
    })

    console.log("fetchStorageSearchData 成功！", response.data);
    return {
      data: response.data.data,
      hasMore: response.data.hasMore,
      sortAfter: response.data.sortAfter,
    }
  } catch (error) {
    console.error("failed to fetch storage search  data", error);
    return null;
  }
}



//路徑
const getStorageCollectionPath = (user)=> {
  checkIsUserValid(user)
  return `users/${user.uid}/storageCollection`
}
const getUserSettingDocPath =(user)=> {
  checkIsUserValid(user)
  return `users/${user.uid}/userSetting/userSetting`
}

const getItemsCollectionPath = (user)=>{
  checkIsUserValid(user)
  return `users/${user.uid}/items`
}



//驗證

export const validSingupEmail = async(user)=>{
  console.log("user for  validSingupEmail : ", user)
  try{
    await sendEmailVerification(user)
  }catch(error){
    console.error("failed to send validation email from firebase", error)
  }
}

//初始化驗證 ＋ 檢查


//user's settnig

export const setupUserSetting = async (
  user, 
  email,  
  username,
) => {
  try {
    const  userSettingData =  {
        email: email,
        username: username,
        created_at: new Date(),
        updated_at: new Date(),
        hasDefaultStorageSet:false,
        darkMode: false,
      }
      const userSettingDocPath = getUserSettingDocPath(user)
      const docRef = doc(db, userSettingDocPath)
      //檢查是否已經建立
      await setDoc(docRef, userSettingData)

      return "success"
  }catch (error) {
    console.error("Failed to set up user setting collection", error);
    return "failed"
  }
}; 

export const updateUsername = async(
  user, 
  newUsername, 
  errorTitle,
  errorText,
)=>{
  try{
    await updateProfile (user, {
      displayName: newUsername,
    })
  }catch(error){
    console.error("failed to upadte usernaem in firebase", error)
    Swal.fire({
      title : errorTitle,
      text: errorText,
      icon: "error"
    })
  }
}

export const getUserSetting = async(user)=>{
  //console.log('user input', user)
  try{
    const userSettingDocPath = getUserSettingDocPath(user)
    const docRef = doc(db, userSettingDocPath)
    const docSanp = await getDoc(docRef);
    if(docSanp.exists()){
      //console.log("userSetting data:", docSanp.data())
      return {
        status: "success",
        data: docSanp.data()
      }
    }else{
      console.log("使用者設定尚未建立")
      return {
        status: "failed",
        data: null,
      }
    }
  }catch(error){
    console.error('讀取 userSetting 資料 失敗',error);
    return {
      status: "failed",
      data: null,
    }
  }
}

export const updateUserSetting = async(user, newSetting)=>{
  try {
    const userSettingDocPath = getUserSettingDocPath(user)
    const docRef = doc(db, userSettingDocPath)
    await updateDoc(docRef, {
      ...newSetting,
    })
    return "success"
  } catch (error) {
    console.error("更新使用者設定失敗",error)
    return "failed"
  }
}


export const updateUserSettingFiled = async(user, filedLabel, filedValue)=>{
  try {
    const userSettingDocPath = getUserSettingDocPath(user);
    const docRef = doc(db, userSettingDocPath)
    await updateDoc(docRef, {
      [filedLabel]: filedValue,
      updated_at: new Date(),
    })
    return "success"
  } catch (error) {
    console.error(`更新使用者欄位, ${filedLabel} : ${filedValue} 失敗`,error)
    return "failed"
  }
}

export const deleteSignupUser =async(user)=>{
  try{
    await deleteUser(user);
  }catch(error){  
    console.error(`使用者 ${user.displayName} 刪除失敗`, error)
  }
}



//storage
export const createStorage = async (user, storageTitle) => {
  try {
    if (!user?.uid) {
      throw new Error('使用者未登入');
    }
  
    const storageCollectionPath = getStorageCollectionPath(user)
    const storageCollectionRef = collection(db, storageCollectionPath)
    console.log('重複建立檢查!')
    const {data, status} = await getAllStorages(user)
    
    if(status === "failed"){
      console.error("取得所有儲位失敗")
      return "failed"
    }

    const isStorageExist = data.some((item)=> item.storageTitle === storageTitle)
    if(isStorageExist){
      console.log(`儲位${storageTitle}已經存在`)
      return "failed"
    }else{
      console.log('不存在於現有 data :',data)
    }

    const storageDocRef = await addDoc(storageCollectionRef,{
      storageTitle: storageTitle,
      created_at : new Date(),
      update_at : new Date(),
    })
    //更新文件id
    const storageId = storageDocRef.id
    if(!storageId){ 
      console.log(`儲位 ${storageTitle} 文件 id建立失敗`)
      return "failed"
    }else{
      updateDoc(storageDocRef,{
        storageId : storageId,
      })
      console.log(`儲位 ${storageTitle} 新增成功`)
      return "success"
    }

  } catch (error) {
    console.error(`儲位 ${storageTitle} 文件建立失敗：`, error);
    return "failed"
  }
};



export const updateStorageTitle = async(
  user, 
  storageId, 
  newStorageTitle
)=>{
    try {
      const storageCollectionPath = getStorageCollectionPath(user)
      const storageRef = doc(db,`${storageCollectionPath}/${storageId}` )
      console.log(`${storageCollectionPath}/${storageId}`)
      const isStorageExist = await checkIsDocExist(storageRef)
      if(!isStorageExist){
        console.log(`storageId :${storageId} 文件不存在`)
        return "failed"
      }
    
      updateDoc(storageRef, {
        storageTitle: newStorageTitle,
        update_at:new Date(),
      })

      return "success"
    } catch (error) {
      console.error(`儲位名稱更新為 ${newStorageTitle} 失敗`,error)
      return "failed"
    }
}

export const deleteStorage = async (user, storageId) => {
  try {
    //清除 storage doc 資料
    const storageCollectionPath = getStorageCollectionPath(user)
    const storageRef = doc(db, `${storageCollectionPath}/${storageId}`)
    
    const isStorageExist = await checkIsDocExist(storageRef)
    if(!isStorageExist){
      console.log(`指定 id 不存在資料庫中`)
      return "failed"
    }
    //監聽文件 刪除 與否
    let isDeleted = false; 
    const unsubscribe = onSnapshot(storageRef, (docSnap) => {
        if (!docSnap.exists()) {
          console.log(`儲位對應 id ${storageId} 已經刪除 `);
          isDeleted = true;
          unsubscribe(); 
        } else {
          console.log(`儲位對應 id ${storageId} 尚未刪除`);
        }
    }, (error)=>{
        console.error("onSnapshot error:", error)
        return "failed"
    });

    await deleteDoc(storageRef);

    await new Promise(resolve => setTimeout(resolve, 500)); 

    if (!isDeleted) {
        console.log('刪除 storage 文件 失敗 ');
        return "failed";
    }

    return "success"
  } catch (error) {
    console.error(`刪除儲位 id: ${storageId} 失敗`, error)
    return "failed"
  } 
}


export const getAllStorages = async (user) => {
  try {
    //直接進 storageCollection 取所有文件
    const storageCollectionPath = getStorageCollectionPath(user);
    const collectionRef = collection(db, storageCollectionPath)
    const snapshot = await getDocs(collectionRef)

    const storageList = snapshot.docs.map((doc)=>({
      id: doc.id,
      storageTitle : doc.data().storageTitle,
    }))

    return {
      status : "success",
      data: storageList,
    }
    
  } catch (error) {
    console.error("Failed to get all storageNames",error)
    return {
      status : "failed",
      data: null,
    }
  }
};


//item
export const setupItemsCollection = async (user) => {
  try {
    const itemsCollectionPath = getItemsCollectionPath(user)
    const collectionDetailRef = doc(db, `${itemsCollectionPath}/collectionDetail`)
    await setDoc(collectionDetailRef, {
      created_at : new Date(),
      update_at: new Date(),
    })
    return {status :"success"}
  } catch (error) {
    console.error(`items 集合建立失敗`, error)
    return {
      status: "failed", 
      error: error 
    }
  }
}






export const getItemById =async(user, itemId)=>{
  try {
    const itemsCollectionPath = getItemsCollectionPath(user);
    const itemDocRef = doc(db, `${itemsCollectionPath}/${itemId}`)
    const docSnap = await getDoc(itemDocRef);
    if(!docSnap.exists()){
      console.log(`指定 id ${itemId} 文件不存在！`)
      return {
        status: "failed", 
        data: null,
      }
    }else{
      const data = docSnap.data();
      return {
        status: "success", 
        data: data,
      }
    }

  } catch (error) {
    console.error(`讀取 id : ${itemId} 的項目失敗`, error)
    return{
      status: "failed",
      data: null,
      error: error.message,
    }
  }
}


export const createStorageItem = async(
  user,
  newItem,
)=>{
  try {
    const itemsCollectionPath = getItemsCollectionPath(user)
    const itemsRef = collection(db, itemsCollectionPath)
    const docSnapshot = await addDoc(itemsRef, {
      ...newItem
    })
    const itemId = docSnapshot.id
    //更新文件 id
    const itemDocRef = doc(db, `${itemsCollectionPath}/${itemId}`)
    await updateDoc(itemDocRef, {
      itemId: itemId
    })
    return {
      status: "success",
      itemId: itemId,
    }
  } catch (error) {
    console.error('新增儲位項目失敗',error)
    return {
      status: "failed",
      itemId: null,
    }
  }
}

//通用
const getItemDocRef = (user,itemId)=>{
  const itemsCollectionPath = getItemsCollectionPath(user)
  const itemDocRef = doc(db, `${itemsCollectionPath}/${itemId}`)
  return itemDocRef
}


//update  item 
export const updateItemById = async(
  user,
  itemId,
  newItem,
)=>{
  try {
    const itemDocRef = getItemDocRef(user, itemId)
    const isExist = checkIsDocExist(itemDocRef)
    if(isExist){
      updateDoc(itemDocRef, {
        ...newItem
      })
      return "success"
    }else{
      console.log(`id :${itemId} 文件 不存在`)
      return "failed"
    }
  } catch (error) {
    console.error(`更新 id: ${itemId} 文件失敗`,error)
    return "failed"
  }
}


export const deleteItemById = async (user, itemId) => {
  try {
    const itemDocRef = getItemDocRef(user, itemId);
    if (!itemDocRef) {
      console.error("getItemDocRef 返回了 undefined");
      return "failed";
    }

    const isExist = await checkIsDocExist(itemDocRef);
    if (!isExist) {
      console.log(`id :${itemId} 文件 不存在資料庫中`);
      return "failed";
    }

    await deleteDoc(itemDocRef);
    console.log(`成功刪除 id : ${itemId}`);
    return "success";

  } catch (error) {
    console.error(`刪除項目 id: ${itemId} 文件失敗`, error);
    return "failed";
  }
};


//get storage items , 篩選 ＋ 排序 : storageId  + created_at 
export const getStorageSortedItems = async(
  user, 
  storageId, 
  sortBy,
  isDescending,
  limitNumber = 0,
  lastSortValue = null,
)=>{
  try { 
    //確認使用者有效
    checkIsUserValid(user)
    const sortDirection = isDescending ? "desc": "asc"
    const itemsRef = collection(db, `users/${user.uid}/items`)

    //篩選 storageId 儲位 item
    let itemQuery = query(itemsRef, 
      where("storageId", "==", storageId),
      orderBy(sortBy, sortDirection),
      orderBy("__name__", "desc")
    )
    
    //若有 lastSortValue
    if(lastSortValue){
      console.log('lastSortValue is ', lastSortValue)
      itemQuery = query(itemQuery, startAfter(lastSortValue.sortBy, lastSortValue.__name__))
    }

    //根據  limitNumber 調整
    if(limitNumber > 0){

      itemQuery = query(itemQuery, limit(limitNumber));
    }
    
    const querySnapshot = await getDocs(itemQuery)
    const docs = querySnapshot.docs

    const data = docs.map((doc)=>({
      id: doc.id,
      ...doc.data(),
    }))

    const hasMore = docs.length === limitNumber;
    const nextSortValue = hasMore ? {
      sortBy: docs[docs.length - 1].get(sortBy),
      __name__: docs[docs.length - 1].id
    } : null


    console.log('return in lastSortValue : nextSortValue is ',nextSortValue)
    return {
      status: "success",
      data: data,
      hasMore: hasMore,
      lastSortValue : nextSortValue,
    }
    
  } catch (error) {
    console.error(`讀取儲位已排序(${sortBy})項目失敗`, error)
    return {
      status: "failed",
      data: null,
      hasMore: null,
      lastSortValue : null,
      errorMsg: "儲位讀取項目失敗"
    }
  }
}



//搜尋
// fetch search storage items
export const fetchSearchStorageItems = async(
  user,
  storageId,
  searchInfo,
  lastSortValue = null,
  limitNumber,

)=>{
  checkIsUserValid(user)
  try {
    const durationTimeStamp = getDurationTimeStamp(searchInfo.duration)
    //傳入後端
    const response = await axiosInstance.get("getItemsOfStorageBySearch", {
      params:{
        storageId: storageId,
        limitNumber: limitNumber,
        searchBy: searchInfo.searchBy,
        input: searchInfo.input,
        sortBy : searchInfo.sortOfTime,
        durationTimeStamp : durationTimeStamp,
        lastSortValue: lastSortValue
      }
    })

    if(response.status === 200){
      return {
        status :"success",
        data: response.data.data,
        hasMore: response.data.hasMore,
        lastSortValue : response.data.lastSortValue
      }
    }else if(response.status === 400){
      console.error("Invalid lastSortValue");
      return{
        status :"failed",
        data: null,
        hasMore: null,
        lastSortValue : null,
        error: "排序標記值無效"
      }
    }else {
      return{
        status :"failed",
        data: null,
        hasMore: null,
        lastSortValue : null,
      }
    }
    
  } catch (error) {
    console.error(`搜尋資料失敗`,error)
    return {
      status :"failed",
      data: null,
      hasMore: null,
      lastSortValue: null,
      error: "搜尋失敗"
    }
  }
}

//TODO: 全部 items 搜尋 , name === input , sortBy created_at || expired_date
//searchItemsOfAll



//過期查詢
//checkExpiredItems
export const fetchStorageExpiredItems  = async (
  user,
  storageId,
  limitNumber, 
  duration,
  lastSortValue = null,
) => {
  checkIsUserValid(user)
  console.log('fetchStorageExpiredItems input:',
    storageId,
    limitNumber, 
    duration
  )
  try {
    const expiredTimeStamp = getDurationTimeStamp(duration)
    //取得資料
    const response = await axiosInstance.get("/getExpiredStorageItems", {
      params:{
        limitNumber: limitNumber,
        lastSortValue: lastSortValue,
        expiredTimeStamp : expiredTimeStamp,
        storageId: storageId,
      }
    })

    if(response.status === 200){
      return {
        status :"success",
        data: response.data.data,
        hasMore: response.data.hasMore,
        lastSortValue : response.data.lastSortValue,
        totalCount : response.data.totalCount,
      }
    }else if(response.status === 400){
      console.error("Invalid lastSortValue");
      return{
        status :"failed",
        data: null,
        hasMore: null,
        lastSortValue : null,
        error: "載入更多項目失敗"
      }
    }else {
      return{
        status :"failed",
        data: null,
        hasMore: null,
        lastSortValue : null,
      }
    }

  } catch (error) {
    console.error(`讀取範圍內過期項目失敗`,error)
    return{
      status :"failed",
      data: null,
      hasMore: null,
      lastSortValue : null,
      error: "過期項目讀取失敗"
    }
  }
}

//notice borad :memos
//getAllMemos

//createMemo

//updateMemoDetail

//deleteMemo








