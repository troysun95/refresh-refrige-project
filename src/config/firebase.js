import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    GoogleAuthProvider,
} from "firebase/auth";
import { collection,  getDocs, getFirestore } from "firebase/firestore";
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
export const auth = getAuth(app)
export const provide = new GoogleAuthProvider();

//get all datas
export const getAllDatas = async () => {
    const querySnapshot = await getDocs(collection(db, "User001"));
    querySnapshot.forEach((doc) => {
      console.log(doc.id, " => ", doc.data());
    });
    return querySnapshot;
}