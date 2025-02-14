import { 
  deleteDoc, deleteField, serverTimestamp, Timestamp, onSnapshot,orderBy,
  // limit,
  // FieldValue,
  // arrayUnion,
  // listCollections,
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

//指向 本地 funcions 路徑：



//動態加上 idToken
// axiosInstance.interceptors.request.use(async (config) => {
//   const auth = getAuth();
//   const user = auth.currentUser;

//   if (user) {
//     const idToken = await user.getIdToken();
//     config.headers.Authorization = `Bearer ${idToken}`;
//   }

//   return config;
// }, (error) => {
//   return Promise.reject(error);
// });

// export default axiosInstance;

//通用
const checkIsDatabaseExist = async(checkDocRef, databaseName)=>{
  const docSnap = await getDoc(checkDocRef)
  if(docSnap.exists()){
    throw new Error(`資料庫 ${databaseName}已經存在，勿新增以免覆蓋`)
  }
}


const showUserError = async(errorTitle, errorMsg) =>{
    await Swal.fire({
      title: errorTitle,
      text: errorMsg,
      icon: "error"
    })
}




//fetch
export const fetchFilterData = async (
  user, 
  storageId, 
  limitNumber = 0,
  sortBy, 
  descending,
  sortAfter = null,
) => {
  //console.log('fetchFilterData by storageId:', storageId)
  try {
    const userId = user.uid;
    const collectionPath = `users/${userId}/storageCollection/${storageId}/items`; 
    const  params = {
      collectionPath: collectionPath,
      limitNumber :limitNumber,
      sortBy: sortBy,
      descending: descending ? "desc" : "asc",
      sortAfter : sortAfter,
    }
    

    const response = await axiosInstance.get("/getFilteredData",{
     params
    })

    console.log("fetchFilterData 成功！", response.data);
    return {
      data: response.data.data,
      hasMore: response.data.hasMore,
      sortAfter: response.data.sortAfter,
    }
  } catch (error) {
    console.error("failed to fetch filter data", error);
    return null;
  }
};


//確認路徑從前端可以提取資料
export const checkPathData = async(user, storageName)=>{
  try {
    console.log(user)
  } catch (error) {
    console.error(`failed to checkPathData of ${storageName}`)
  }
}


//路徑
const getStorageCollectionPath = (user)=> `users/${user.uid}/storageCollection`
const getUserSettingDocPath =(user)=> `users/${user.uid}/userSetting/userSetting`
const getDocIdsDocPath =(user)=>`users/${user.uid}/docIds/docIds`
const getStorageItemPath = async(user, storageName, itemDocId) => {
  const storageDocId = await getStorageDocId(user, storageName )
  return `users/${user.uid}/storageCollection/${storageDocId}/items/${itemDocId}`
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


//user's settnig

export const updateUsername = async(user, newUsername, errorTitle, errorText)=>{
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



export const deleteSignupUser =async(user)=>{
  try{
    await deleteUser(user);
  }catch(error){  
    console.error("failed to delete user from firebase", error)
  }
}



export const getUserSetting = async(user)=>{
  try{
    const userSettingDocPath = getUserSettingDocPath(user)
    const docRef = doc(db, userSettingDocPath)
    const docSanp = await getDoc(docRef);
    if(docSanp.exists()){
      console.log("userSetting data:", docSanp.data())
    }else{
      console.log("使用者資料尚未建立")
    }
    return docSanp.data();
  }catch(error){
    console.error('failed to get user setting datas',error);
  }
}


export const setupUserSetting = async (
  user, 
  email,  
  username,
) => {
  try {
    const  userSettingData =  {
        email: email,
        username: username,
        createdAt: new Date(),
        hasDefaultStorageSet:false,
      }
      const userSettingDocPath = getUserSettingDocPath(user)
      const newDocRef = doc(db,userSettingDocPath)
      //檢查是否已經建立
      await checkIsDatabaseExist(newDocRef, "userSetting")
      await setDoc(newDocRef, userSettingData)
      console.log("setupUserSettingCollection trigger!")
      return true
  }catch (error) {
    console.error("Failed to set up user setting collection", error);
    return false
  }
}; 


//storage
export const createStorage = async (user, storageName) => {
  try {
    if (!user?.uid) {
      throw new Error('使用者未登入');
    }
    console.log('create storage triggered!')
    const storageCollectionPath = getStorageCollectionPath(user)
    const storageCollectionRef = collection(db, storageCollectionPath)
    const storageDocRef = await addDoc(storageCollectionRef,{
      created_at : new Date(),
      update_at : new Date(),
    })
    const storageNameCollectionRef = collection(storageDocRef, "storageInfo")
    const storageNameDocRef = await addDoc(storageNameCollectionRef, {
      storageName: storageName,
      created_at: new Date(),
    })
    await setupStorageIds(user, storageName, storageDocRef.id, storageNameDocRef.id)
    console.log(`${storageName} 建立成功`)
  } catch (error) {
    console.error(`儲位 ${storageName}文件建立失敗：`, error);
    throw error;
  }
};

//預設 storage 檢查相關(改為查詢id)
export const checkHasStorageSetup =async(user, storageName)=>{
  console.log('checkHasStorageSetup trigger!')
  try {
    const storageDocId = await getStorageDocId(user, storageName)
    const storageNameDocId = await getStorageNameDocId(user, storageName)
    if(storageDocId && storageNameDocId){
      const storageCollectionPath = getStorageCollectionPath(user)
      const storageNameRef = doc(db , `${storageCollectionPath}/${storageDocId}/storageInfo/${storageNameDocId}`)
      const docNameSnap = await getDoc(storageNameRef)
      if(!docNameSnap.exists()){
        console.log(`${storageName} 儲位下無 storageName文件`)
      }
      const name = docNameSnap.data().storageName 
      if(name === storageName){
        return true
      }else{
        console.log('storageName 文件內資料為：', docNameSnap.data())
        return false
      }
    }else if(!storageDocId){
      console.log(`無法取得 ${storageName} 對應 storageDocId`)
      return false
    }else{
      console.log(`無法取得 ${storageName} 對應 storageNameDocId`)
      return false
    }
    
  } catch (error) {
    console.error("Failed to check has storage doc set up ", error)
    return false
  }
}

export const checkDefaultStorageMarkSet = async(user)=>{
  try{
    const userSettingDocPath = getUserSettingDocPath(user)
    const docRef = doc(db, userSettingDocPath)
    //先確認沒有新增過
    const docSnap = await getDoc(docRef);
    if(docSnap.exists()){
      const data = docSnap.data();
      const isDefaultSetExist = data.hasOwnProperty("hasDefaultStorageSet")
      if(isDefaultSetExist){
        //根據是否為 true 回傳
        return data.hasDefaultStorageSet === true;
      }else{
        console.log("無 hasDefaultStorageSet 資料")
        return false
      }
    }else{
      console.log(docSnap.data())
      throw new Error ("usersetting 文件不存在");
    }
  }catch(error){
    console.error("Failed to update default storage set ", error)
  }
}

export const updateHasDefaultSet = async(user)=>{
  console.log('updateHasDefaultSet triggered')
  try{
    //檢測 文件存在
    const checkDefaultFridge = await checkHasStorageSetup(user,"冷藏區")
    const checkDefaultFrezzer = await checkHasStorageSetup(user,"冷凍區")
    if(checkDefaultFridge && checkDefaultFrezzer){
      const userSettingDocPath = getUserSettingDocPath(user)
      const docRef = doc(db, userSettingDocPath)
      //更新欄位值
      await updateDoc(docRef, 
        {hasDefaultStorageSet: true}
      )
    }else{
      const checkFridge = checkDefaultFridge ? "": "冷藏區"
      const checkFreezer = checkDefaultFridge ? "": "冷藏區"
      console.log(`預設儲位文件 ${checkFridge} ${checkFreezer}不存在！`)
      showUserError('預設儲位設置錯誤', '')
    }
  }catch(error){
    console.error("Failed to update  ", error)   
  }
}



export const modifyStorageTitleOfStorage  = async(
  user, 
  oldStorageName, 
  storageDocId, 
  newStorageName
)=>{
  try {
    //修改 storage doc 資料
    const storageCollectionPath = getStorageCollectionPath(user)
    const storageNameDocId = await getStorageNameDocId(user, oldStorageName)
    const stoarageDocRef = doc(db, `${storageCollectionPath}/${storageDocId}/storageInfo/${storageNameDocId}`)
    const docSnap = await getDoc(stoarageDocRef)
    await updateDoc(stoarageDocRef, {
      ...docSnap.data(),
      storageName: newStorageName,
      updated_at: serverTimestamp(),
    })
    return "success"
  } catch (error) {
    console.error(`failed to modify storageTitle into ${newStorageName} `, error)
    return "failed"
  }
}

export const updateStorage =async(
  user, 
  storageDocId, 
  oldStorageName, 
  newStorageName
)=>{
    try {
      const isModifyInStorage = await modifyStorageTitleOfStorage(user, storageDocId, oldStorageName, newStorageName)
      const isModifyOfIds = await modifyStorageTitleOfIds(user,storageDocId,newStorageName)
      if(isModifyInStorage === "success" && isModifyOfIds === "success"){
        console.log('修改儲位名稱成功')
        return "success"
      }else{
        return "failed"
      }
    } catch (error) {
      console.error(`failed to update storage into ${newStorageName}`, error)
      return "failed"
    }
}

export const deleteStorage = async (user, storageDocId) => {
  try {
    //清除 storage doc 資料
    const storageCollectionPath = getStorageCollectionPath(user)
    const storageDocRef = doc(db, `${storageCollectionPath}/${storageDocId}`)
    //監聽文件 刪除 與否
    let isDeleted = false; 
    const unsubscribe = onSnapshot(storageDocRef, (docSnap) => {
        if (!docSnap.exists()) {
            console.log(`儲位對應 id ${storageDocId} 已經刪除 `);
            isDeleted = true;
            unsubscribe(); 
        } else {
            console.log('刪除 storage 文件 仍然存在 ');
        }
    }, (error)=>{
        console.error("onSnapshot error:", error)
        return "failed"
    });

    await deleteDoc(storageDocRef);

    await new Promise(resolve => setTimeout(resolve, 500)); 

    if (!isDeleted) {
        console.log('刪除 storage 文件 失敗 ');
        return "failed";
    }

    const docIdsDocPath = getDocIdsDocPath(user)
    const docIdsRef = doc(db, docIdsDocPath)
    const docIdsSnap = await getDoc(docIdsRef);
    if(!docIdsSnap.exists()){
      console.log('docIds 文件不存在')
      return "failed"
    }
    
    const storageIdsFiled = docIdsSnap.data()[storageDocId]
    if(!storageIdsFiled){
      console.log('儲位對應 ids  文件不存在')
      return "failed"
    }

    await updateDoc(docIdsRef, {
      [storageDocId] : deleteField()
    })

    return "success"
  } catch (error) {
    console.error(`Failed to delete storage of id: ${storageDocId}`, error)
    return "failed"
  } 
}


//docIds
  //storageDocId
export const getStorageDocId = async(user, storageName)=>{
  try {
    const docIdsPath = getDocIdsDocPath(user)
    const docIdsDocRef = doc(db, docIdsPath)
    const docSnap = await getDoc(docIdsDocRef)
    if(!docSnap.exists()){
      console.log(`docIds 文件不存在`)
      return null
    }

   const data = docSnap.data();
   if(!data){
    console.log(`docIds 文件中無資料！`)
    return null
   }
   
   const dataArr = Object.values(data)
   const matchItem = dataArr.find(item => item.storageTitle === storageName)
   if(matchItem){
    return matchItem.storageDocId
   }else{
    console.log(`沒有以 ${storageName} 為 title 的欄位`)
    return null
   }
  } catch (error) {
    console.error(`failed to get  ids`,error)
    return null
  }
}


export const setupStorageIds = async(
  user, 
  storageName, 
  storageDocId, 
  storageNameDocId
)=>{
  try {
    const collectionRef = getDocIdsDocPath(user)
    const docIdsRef = doc(db, collectionRef)
    await setDoc(docIdsRef, {
      [storageDocId]: {
        storageTitle: storageName,
        storageDocId:  storageDocId,
        storageNameDocId: storageNameDocId,
      }
    },{merge: true })
  } catch (error) {
    console.error(`${storageName} 文件 id 更新失敗：`, error);
  }
}


export const modifyStorageTitleOfIds = async (
  user, 
  storageDocId, 
  newStorageName
) => {
  try {
    const docIdsDocPath = getDocIdsDocPath(user)
    const docIdsRef = doc(db, docIdsDocPath)
    const docIdsSnap = await getDoc(docIdsRef);
    if(!docIdsSnap.exists()){
      console.log('docIds 文件不存在')
      return "failed"
    }
    
    const storageIdsFiled = docIdsSnap.data()[storageDocId]
    if(!storageIdsFiled){
      console.log('儲位對應 ids  文件不存在')
      return "failed"
    }
    const newStorageIdsField = {
      ...storageIdsFiled,
      storageTitle: newStorageName,
      updated_at: serverTimestamp(),
    }
    await updateDoc(docIdsRef, {
      [`${storageDocId}`]: newStorageIdsField
    })
    return "success"
  } catch (error) {
    console.error(`failed to modify storageTitle into ${newStorageName} in storage's id: ${storageDocId}`, error)
  }
}


//storageNameDocId
export const getStorageNameDocId = async(user, storageName)=>{
  try {
    const docIdsPath = getDocIdsDocPath(user)
    const docIdsDocRef = doc(db, docIdsPath)
    const docSnap = await getDoc(docIdsDocRef)
    if(!docSnap.exists()){
      console.log(`docIds 文件不存在`)
      return null
    }

   const data = docSnap.data();
   if(!data){
    console.log(`docIds 文件中無資料！`)
    return null
   }
   
   const dataArr = Object.values(data)
   const matchItem = dataArr.find(item => item.storageTitle === storageName)
   if(matchItem){
    console.log(matchItem.storageDocId)
    return matchItem.storageNameDocId
   }else{
    console.log(`沒有以${storageName} 為 title 的欄位`)
    return null
   }
  } catch (error) {
    console.error(`failed to get  ids`,error)
    return null
  }
}

//itemDocId

export const getItemIdsByStorageName = async (user, storageName) => {
  try {
    const docIdsDocPath = getDocIdsDocPath(user)
    const docRef = doc(db, docIdsDocPath)
    const docSnap = await getDoc(docRef)
    if(!docSnap.exists()){
      throw new Error("docIds 文件不存在")
    }
    const ids = docSnap.data()[storageName].itemIds
    return ids;    
  } catch (error) {
    console.error(`Failed to get ${storageName} itemIds`,error)
  }
}

export const addItemDocId = async(user, storageDocId, itemDocId)=>{
  console.log('addItemDocId trigger')
  try {
    const docIdsPath = getDocIdsDocPath(user)
    const docIdsRef = doc(db, docIdsPath)
    const docSnap = await getDoc(docIdsRef)
    if(!docSnap.exists()){
      throw new Error('無 docIds 文件')
    }

    const data = docSnap.data()[storageDocId]
    if(!data){
      throw new Error(`docIds 文件無 ${storageDocId} 文件`)
    }

    if(!data.itemIds) {
      console.log('docIds itemIds 不存在！')
      await updateDoc(docIdsRef, {
        [`${storageDocId}.itemIds`]: {},
      });
      console.log(`初始化 ${storageDocId} itemIds 欄位`);
    }

    const itemIdInfo = {
      id: itemDocId,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(), 
    }

    await updateDoc(docIdsRef, {
      [`${storageDocId}.itemIds.${itemDocId}`]: itemIdInfo,
      [`${storageDocId}.updated_at`]: serverTimestamp()
    });

    return "success"
  } catch (error) {
    console.error(`failed to add  itemDocId ${itemDocId} to docIds collection of stroageID :${storageDocId} `, error)
    return "failed"
  }
}

export const removeItemDocId = async (user, storageName, itemDocId) => {
  try {
    const docIdsPath = getDocIdsDocPath(user);
    const docIdsRef = doc(db, docIdsPath);
    const storageDocId = await getStorageDocId(user, storageName)

    await updateDoc(docIdsRef, {
      [`${storageDocId}.itemIds.${itemDocId}`]: deleteField(),
    });

    const docSnapOfIds = await getDoc(docIdsRef);
    const dataOfIds = docSnapOfIds.data();

    if (dataOfIds?.[storageDocId]?.itemIds?.[itemDocId]) {
      return "failed";
    } else {
      return "success";
    }
  } catch (error) {
    console.error(`Failed to delete item ${itemDocId} in ${storageName}`, error);
    return "failed";
  }
};



//storageTitle
export const getStorageTitle = async (user, storageDocId) => {
  try {
    const docIdsPath = getDocIdsDocPath(user)
    const docIdsRef = doc(db, docIdsPath)
    const docSnap = await getDoc(docIdsRef)
    if(!docSnap.exists()){
      console.log('ids 文件不存在')
      return null;
    }
    const data = docSnap.data();
    const idsOfStorage = data[storageDocId]
    if(!idsOfStorage){
      console.log(`無id ${storageDocId} 對應 id 欄位`)
      return null
    }
    const storageTitle = idsOfStorage.storageTitle;
    return storageTitle ? storageTitle : null
  } catch (error) {
    console.error(`failed to get storageTitle of ids:  ${storageDocId} `)
  }
}

export const getAllStorageTitles = async (user) => {
  try {
    const docIdsDocPath = getDocIdsDocPath(user)
    const docRef = doc(db ,docIdsDocPath)
    const docSnap = await getDoc(docRef)
    if(!docSnap.exists()){
      throw new Error("路徑不存在文件！")
    }
    const docDataArr = Object.values(docSnap.data())
    const storageTitles = docDataArr.map((item)=> ({
      storageDocId : item.storageDocId, storageTitle: item.storageTitle
    }))
    return storageTitles
    
  } catch (error) {
    console.error("Failed to get all storageNames",error)
    showUserError("儲位名稱錯誤", "無法取得所有儲位名稱")
  }
};



export const getStorageItemById =async(user, storageName, itemDocId)=>{
  try {
    const storageDocId  = await getStorageDocId(user, storageName);
    const storageCollectionPath = getStorageCollectionPath(user)
    const itemDocRef = doc(db , `${storageCollectionPath}/${storageDocId}/items/${itemDocId}`)
    const docSnap = await getDoc(itemDocRef)
    if(docSnap.exists()){
      return docSnap.data()
    }else{
      console.log(`文件 ${storageName} 下 id ：${itemDocId} 無資料存在`)
      return null
    }
  } catch (error) {
    console.error(`Failed to get storage  ${storageName} item by id: ${itemDocId}`, error)
    return null
  }
}

//向 firebase 請求
export const getStorageItems = async (
  user, 
  storageName, 
  sortBy,
  limitNumber = 0,
  descending = false,
) => {
  try {
    const storageCollectionPath = getStorageCollectionPath(user)
    const storageDocId =  await getStorageDocId(user, storageName);
    const itemsCollectionRef = collection(db, `${storageCollectionPath}/${storageDocId}/items`)

    let q = query(itemsCollectionRef);

    //根據參數調整請求資料
    if(sortBy){
      // 儲存在 請求 orderBy ，並使用官方給予 desc (近到早) || asc 方法
      query = query(query, orderBy(sortBy, descending ? 'desc': 'asc'))
    }

    if(limitNumber > 0){
      //存在 請求 .limit裡面
      query = query.limit(limitNumber)
    }

    const querySnapshot = await getDocs(q);

    //無資料返回 null
    if(querySnapshot.empty){
      return null
    }
    const storageItems =  querySnapshot.docs.map((doc)=>({
      id:doc.id, ...doc.data()}
    ))

    return  storageItems
  } catch (error) {
    console.error(`failed to get storage items of storage ${storageName}`, error)
  }
}

//storage item
export const createStorageItem = async(
  user, 
  newItem,
  storageDocId,
)=>{
  try {
    const {isItemSetup, itemDocId} = await setupStorageItem(user, newItem, storageDocId )
    console.log('isItemSetup',isItemSetup,'itemDocId',itemDocId)
    if(itemDocId && isItemSetup === "success"){
      //將 id 放進 docIds
      const isitemIdAdded = await addItemDocId(user, storageDocId,itemDocId)
      console.log('isitemIdAdded',isitemIdAdded )
      if(isitemIdAdded === "success"){
        console.log('item 文件 id 新增成功')
        return {
          state: "success",
          itemDocId : itemDocId
        }
      }else{
        console.log('item 文件 id 新增失敗')
        return "failed"
      }
    }else{
      console.log('item新增至 storage 失敗')
      return "failed"
    }
    
    
  } catch (error) {
    console.error(`failed to create new item`, error)
    return "failed"
  }
}


export const setupStorageItem = async (user, newItem, storageDocId) => {
  try {
    const storageCollectionPath = getStorageCollectionPath(user);
    const storageRef = doc(db, `${storageCollectionPath}/${storageDocId}`);
    const docSnap = await getDoc(storageRef);
    console.log('storageDocId',storageDocId)

    if (!docSnap.exists()) {
      console.log(`儲位文件 ${storageDocId} 不存在`);
      return { isItemSetup: "failed" };
    }

    const storageItemsRef = collection(storageRef, "items");
    const querySnapshot = await getDocs(storageItemsRef);

    if (querySnapshot.empty) {
      console.log("該 storage 不具有 items 子集合, 新增中...");
    }

    const itemDocSnap = await addDoc(storageItemsRef, { ...newItem });
    const itemDocId = itemDocSnap.id;

    //將 id 加回去 item 文件裡
    const itemDocRef = doc(db, `${storageCollectionPath}/${storageDocId}/items/${itemDocId}`)
    await updateDoc(itemDocRef, {
      ...newItem,
      id: itemDocId
    })
    return {
      isItemSetup: "success",
      itemDocId: itemDocId,
    };
  } catch (error) {
    console.error(`Failed to set up new item: `, newItem, error);
    return { isItemSetup: "failed" };
  }
};


export const updateStorageItem = async(
  user, 
  storageName, 
  itemDocId, 
  newItem
)=>{
  try {
    const storageItemPath = await getStorageItemPath(user, storageName, itemDocId)
    const itemDocRef = doc(db , storageItemPath)
    console.log(storageItemPath)
    const docSnap = await getDoc(itemDocRef)
    if(!docSnap.exists()){
      throw new Error(`指定 id ${itemDocId} 文件不存在資料！`)
    }

    const prevData = docSnap.data()
    await updateDoc(itemDocRef, {
      ...prevData,
      ...newItem
    })
    return "success"
  } catch (error) {
    console.error(`failed to update ${storageName} item ${itemDocId}`,error)
    return "failed "
  }
}

export const deleteStorageItem = async (user, storageName, itemDocId) => {
  try {
    const isIdRemoved = await removeItemDocId(user, storageName, itemDocId);
    const isItemRemoved = await removeItemFromStorage(user, storageName, itemDocId)
    if(isIdRemoved === "success" && isItemRemoved === "success"){
      return "success"
    }else{
      return "failed"
    }
  } catch (error) {
    console.error(`failed to delete storage: ${storageName} item if id ${itemDocId}`, error)
  }
};

export const removeItemFromStorage = async (user, storageName, itemDocId) => {
  try {
    const itemDocPath = await getStorageItemPath(user, storageName, itemDocId);
    const itemDocRef = doc(db, itemDocPath);
    await deleteDoc(itemDocRef);
    return "success"
  } catch (error) {
    console.error(`failed to remove item of id :${itemDocId} from ${storageName}`, error)
    return "failed"
  }
}

//re-arrange
//get storage items arranged (created , updated , nmae ...)


//Expired 
//get  storage expired item by today
export const getExpiredStorageItemsByToday = async (user, storageName) => {
  try {
    const today  = new Date();
    today.setHours(0,0,0,0)
    const fireStoreToday = Timestamp.fromDate(today)
    const storageCollectionPath = getStorageCollectionPath(user)
    const storageDocId = await getStorageDocId(user, storageName)
    const itemsCollectionRef = collection(db, `${storageCollectionPath}/${storageDocId}/items`)
    const q = query(itemsCollectionRef, where('expired_date', "<=", fireStoreToday))
    const querySnapshot = await getDocs(q)
    const expiredItems = querySnapshot.docs.map((doc)=> doc.data());
    if(expiredItems){
      return expiredItems
    }else{
      return []
    }
  } catch (error) { 
    console.error(`Failed to get  storage expired items by today`,error )
  }
}

//Search stroage items
export const searchStorageItems =()=>{

}