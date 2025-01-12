import { FieldValue, Firestore, Timestamp } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { 
  deleteUser,
    getAuth, 
    GoogleAuthProvider,
    sendEmailVerification,
    updateProfile,
} from "firebase/auth";
import { collection,  getFirestore, setDoc, doc ,getDoc, getDocs, updateDoc, query, where,
  addDoc, arrayUnion,
} from "firebase/firestore";
import Swal from "sweetalert2";

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

//路徑
const getStorageCollectionPath = (user)=> `users/${user.uid}/storageCollection`
const getUserSettingDocPath =(user)=> `users/${user.uid}/userSetting/userSetting`
const getDocIdsDocPath =(user)=>`users/${user.uid}/docIds/docIds`

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

    const storageCollectionPath = getStorageCollectionPath(user)
    const storageCollectionRef = collection(db, storageCollectionPath)
    const storageDocRef = await addDoc(storageCollectionRef,{
      created_at : new Date(),
      update_at : new Date(),
    })
    const storageNameCollectionRef = collection(storageDocRef, storageName)
    const storageNameDocRef = await addDoc(storageNameCollectionRef, {
      storageName: storageName,
      created_at: new Date(),
    })
    console.log(`${storageName} 建立成功`)
    await setupStorageIds(user, storageName, storageDocRef.id, storageNameDocRef.id)
  } catch (error) {
    console.error(`儲位 ${storageName}文件建立失敗：`, error);
    throw error;
  }
};


//預設 storage 檢查相關
export const checkHasStorageSetup =async(user, storageName)=>{
  try {
    //檢查 sotarge 文件是否建立
    const storageDocId = await getStorageDocId(user, storageName)
    console.log('storageDocId:', storageDocId)
    //取得路徑
    const storageCollectionPath = getStorageCollectionPath(user)
    const storageDocRef = doc(db, storageCollectionPath, storageDocId)
    const docSnap = await getDoc(storageDocRef)
    return docSnap.exists();
  } catch (error) {
    console.error("Failed to check has storage doc set up ", error)
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
      throw new Error ("指向路徑文件不存在資料");
    }
  }catch(error){
    console.error("Failed to update default storage set ", error)
  }
}



export const updateHasDefaultSet = async(user)=>{
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

//docIds
export const getStorageDocId = async(user, storageName)=>{
  try {
    const docIdsPath = getDocIdsDocPath(user)
    const docIdsDocRef = doc(db, docIdsPath)
    const docSnap = await getDoc(docIdsDocRef)
    const storageDocId = docSnap.data()[storageName].storageDocId
    if(!storageDocId){
      throw new Error(` 文件 ${storageName} storageDocId 錯誤！`, storageDocId)
    }
    return storageDocId
  } catch (error) {
    console.error(`failed to get  ids`,error)
  }
}

export const setupStorageIds = async(user, storageName, storageDocId, storageNameDocId)=>{
  try {
    const collectionRef = getDocIdsDocPath(user)
    const docIdsRef = doc(db, collectionRef)
    await setDoc(docIdsRef, {
      [storageName]: {
        storageTitle: storageName,
        storageDocId:  storageDocId,
        storageNameDocId: storageNameDocId,
      }
    },{merge: true })
  } catch (error) {
    console.error(`${storageName} 文件 id 更新失敗：`, error);
  }
}

// 讀取 docIds 文件下的欄位名稱, 若回傳 storageDocId 與 storageTitle
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
    //console.log('現有儲位Card 資料：',storageTitles)
    return storageTitles
    
  } catch (error) {
    console.error("Failed to get all storageNames",error)
    showUserError("儲位名稱錯誤", "無法取得所有儲位名稱")
  }
};



// set up  item doc id
export const setupItemDocId = async(user, storageName, itemDocId)=>{
  try {
    const docIdsPath = getDocIdsDocPath(user)
    const docIdsRef = doc(db, docIdsPath)
    const docSnap = await getDoc(docIdsRef)
    if(!docSnap.exists()){
      throw new Error('無 docIds 文件')
    }

    const data = docSnap.data()[storageName]
    if(!data){
      throw new Error(`docIds 文件無 ${storageName} 文件`)
    }

    if(data && !data.itemIds) {
      await updateDoc(docIdsRef, {
        [storageName]:{
          ...data,
          itemIds:[]
        }
      })
    }
    
    await updateDoc(docIdsRef,{
      [`${storageName}.itemIds`]: arrayUnion(itemDocId)
    })

    console.log(`${storageName} 儲位 新增 id${itemDocId} 成功`)
  } catch (error) {
    console.error("failed to set up  itemDocId to docIds collection ", error)
  }
}


//get storage item ids
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


//stroage items
export const createStorageItem = async (user, storageName, newItem) => {
  try {
    const storageDocId = await getStorageDocId(user, storageName)
    if(!storageDocId){
      throw new Error(`儲位 ${storageName} 無文件 id`)
    }
    const storageCollectionPath = getStorageCollectionPath(user)
    const itemCollectionRef = collection(db, `${storageCollectionPath}/${storageDocId}/items`)
    const itemDocRef = await addDoc(itemCollectionRef, newItem)
    await setupItemDocId(user, storageName, itemDocRef.id);
  } catch (error) {
    console.error(`Failed to create item in storage ${storageName}`, error);
  }
};


//get storage item by id
export const getStorageItemById =async(user, storageName, itemDocId)=>{
  //console.log(`getStorageItemById : ${itemDocId}`)
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
  }
}

//get storage (limited) items
export const getStorageItems = async (user, storageName, limitNumber = 0) => {
  try {
    const itemIds = await getItemIdsByStorageName(user, storageName)
    if(itemIds){
      const filteredItemsDocIds = limitNumber ?  itemIds.slice(0, limitNumber) : itemIds
      const storageItems = await Promise.all(
        filteredItemsDocIds.map(async(itemId)=>{
            const item =  await getStorageItemById(user, storageName, itemId)
            return item;
        })
      )
        return storageItems;
    }else{
      console.log(`文件 ${storageName}下  無文件 items 存在`)
      return null
    }
  } catch (error) {
    if(!storageName){
      console.log(`尚未傳入 storageName ${storageName}`)
    }else{
      console.error(`Failed to get storage : ${storageName} all items`, error)
    }
  }
}

//get  storage expired item by today
export const getExpiredStorageItemsByToday = async (user, storageName) => {
  try {
    const today  = new Date();
    //只比較日期部分
    today.setHours(0,0,0,0)
    const fireStoreToday = Timestamp.fromDate(today)
    const storageCollectionPath = getStorageCollectionPath(user)
    const storageDocId = await getStorageDocId(user, storageName)
    const itemsCollectionRef = collection(db, `${storageCollectionPath}/${storageDocId}/items`)
    //存進格式應該是日期字串 , 或是本身用 firestore timestamp 筆
    const q = query(itemsCollectionRef, where('expired_date', "<=", fireStoreToday))
    const querySnapshot = await getDocs(q)
    console.log(querySnapshot)
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
