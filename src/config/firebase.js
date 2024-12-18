import { initializeApp } from "firebase/app";
import { 
  deleteUser,
    getAuth, 
    GoogleAuthProvider,
    sendEmailVerification,
    updateProfile,
} from "firebase/auth";
import { collection,  getDocs, getFirestore, setDoc, doc } from "firebase/firestore";
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

//firebase 資料庫
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)

//驗證使用者相關
export const auth = getAuth(app);
export const provide = new GoogleAuthProvider();

//get all datas
export const getAllDatas = async () => {
    const querySnapshot = await getDocs(collection(db, "User001"));
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
    });
    return querySnapshot;
}

//使用者 email 驗證
export const validSingupEmail = async(user)=>{
  console.log("user for  validSingupEmail : ", user)
  try{
    await sendEmailVerification(user)
  }catch(error){
    console.error("failed to send validation email from firebase", error)
  }
}

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

export const setupUserCollection =async(user, setupUsername)=>{
  try{
    await setDoc(doc(db, "users", user.uid),{
      username: setupUsername,
      createdAt: new Date(),
  })
  return true
  }catch(error){
    console.error("failed to set up user collection",error)
    return false
  }
}


export const deleteSignupUser =async(user)=>{
  try{
    await deleteUser(user);
  }catch(error){  
    console.error("failed to delete user from firebase", error)
  }
}