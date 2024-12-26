import { TrySharp } from "@mui/icons-material";
import { initializeApp } from "firebase/app";
import { 
  deleteUser,
    getAuth, 
    GoogleAuthProvider,
    sendEmailVerification,
    updateProfile,
} from "firebase/auth";
import { collection,  getFirestore, setDoc, doc ,getDoc, getDocs} from "firebase/firestore";
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
    const docRef = doc(db, "users", user.uid, "userSetting", "userSetting")
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


export const setupUserSettingCollection = async (
  user, 
  email,  
  username,
) => {
  try {
    const  userSettingData =  {
        email: email,
        username: username,
        createdAt: new Date(),
      }
      //改為 直接命名 id 為 userSetting
      const newDocRef = doc(db, "users", user.uid, "userSetting", "userSetting")
      await setDoc(newDocRef, userSettingData)
      return true
  }catch (error) {
    console.error("Failed to set up user setting collection", error);
    return false
  }
};

//storage collection

//新增 storage section 
// export const createStorage= async (user, storageName) => {
//   try {
//     const initialData =[]
//     const storageCollectionPath = getStorageCollectionPath(user);
//     //建立 docRef 以便新增以及檢查命名重複 
//     const collectionRef = doc(db, storageCollectionPath, storageName)
//     const docSnap = await getDoc(collectionRef)
    
//     if(docSnap.exists()){
//       console.error(`儲位 ${storageName} 已經建立，請使用不同名稱`)
//       return
//     }else{
//       await setDoc(collectionRef,{[storageName]:initialData}, {merge:true})
//       console.log(`儲位 ${storageName} 建立成功`)
//     }

//   } catch (error) {
//     console.error("創建儲位失敗：", error);
//     throw error;
//   }
// };


// 創建儲位函式
export const createStorage = async (user, storageName) => {
  try {
    if (!user?.uid) {
      throw new Error('使用者未登入');
    }

    const storageCollectionPath = `users/${user.uid}/storageCollection`; // 集合路徑
    const docRef = doc(db, storageCollectionPath, storageName); // 文件路徑

    // 檢查文件是否已存在
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.error(`儲位 ${storageName} 已經存在，請使用不同的名稱`);
      return;
    }

    // 初始資料
    const initialData = {
      items: [] // 初始為空清單
    };

    // 建立文件
    await setDoc(docRef, initialData);
    console.log(`儲位 ${storageName} 建立成功`);

  } catch (error) {
    console.error('創建儲位失敗：', error);
    throw error;
  }
};

// 讀取所有儲位名稱
export const getAllStorageNames = async (user) => {
  try {
    if (!user?.uid) {
      throw new Error('使用者未登入');
    }

    const storageCollectionPath = `users/${user.uid}/storageCollection`; // 集合路徑
    const collectionRef = collection(db, storageCollectionPath);

    // 獲取集合下所有文件
    const querySnapshot = await getDocs(collectionRef);

    // 返回文件名稱列表
    const storageNames = querySnapshot.docs.map((doc) => doc.id);
    console.log('儲位名稱：',storageNames)
    //return storageNames;

  } catch (error) {
    console.error('讀取儲位名稱失敗：', error);
    throw error;
  }
};

//取得某一儲位資料 (就是直接取文件)
const  checkUserVaid =(user)=>{
  if (!user?.uid) {
    throw new Error('使用者未登入s');
  }
}

//取得資料
export const getStorageAllDatas = async(user, storageName)=>{
  try{
    const storageDocRef = doc(db, `users/${user.uid}/storageCollection/${storageName}`)
    const docSnap = await getDoc(storageDocRef);
    if(docSnap.exists()){
      return docSnap.data();
    }else{
      console.log(`指定 儲位${storageName} 不存在`)
    }
  }catch(error){
    console.error(`failed to get storage: ${storageName} all datas`, error)
  }
}


