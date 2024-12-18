import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {auth, provide, setupUserCollection} from "../config/firebase";
import Swal from "sweetalert2";
import {db} from "../config/firebase"
import { getDoc, doc} from "firebase/firestore";
import { updateBtnDisabled } from "../fn";
import { useAuth } from "../contexts/AuthContext";
import {  useEffect, useState } from "react";

const LoginWarningModal = ({setHasUserConfirmed, setIsModalOpen})=>{

    const handleConfirmUpdate =()=>{
        setHasUserConfirmed(true)
    }

    return(
        <>
            <div >
                <div>
                    若曾使用此郵件註冊過，使用 Google 登入將同步 Google 資訊並覆蓋現有資料。是否繼續？
                </div>
                <div>
                    <button onClick={handleConfirmUpdate}>確定</button>
                    <button onClick={()=>{
                        setIsModalOpen(false)
                    }}>取消</button>
                </div>
            </div>
        </>
    )
}

const LoginPage =()=>{
    const navigate = useNavigate();
    const {setIsUsercollectionExist} = useAuth()
    const [loginInput, setLoginInput] = useState({
        email: "",
        password: ""
    })
    const [validLabel, setValidLabel] = useState({
        email:"",
        password: ""
    })
    const [isValid, setIsValid]=useState({
        email: false,
        password: false
    })
    const [loginDisabled, setLoginDisabled] = useState(true)
    const [ hasUserConfirmed, setHasUserConfirmed] = useState(false)
    const [isModalOpened, setIsModalOpen]= useState(false)
    
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        //宣告變數儲存更新的 input 與相關數值
        let validationMessage = "";
        let isFieldValid = false;
    
        // 檢查輸入是否為空
        if (value.trim().length === 0) {
            validationMessage = "此處不可以為空白";
        } else {
            if (name === "email") {
                // 檢查 email 格式
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                isFieldValid = emailRegex.test(value);
                validationMessage = isFieldValid ? "" : "請輸入正確郵件格式";
                console.log("檢視 email validation :", isFieldValid)
            } else if (name === "password") {
                // 檢查密碼長度
                isFieldValid = value.trim().length >= 6;
                validationMessage = isFieldValid ? "" : "請輸入 6 個以上字元"
            }
        }
    
    
        // 更新狀態
        setLoginInput((prev) => ({
            ...prev,
            [name]:value,
        }));
        setValidLabel((prev) => ({
            ...prev,
            [name]:validationMessage
        }));
        setIsValid((prev) => ({
            ...prev,
            [name]: isFieldValid
        }));
    };


    const checkCollectionExist = async(user) => {
        const userUid = user.uid
        //取得文件ref
        const docRef = doc(db, "users", userUid)
        //firestore 文件snap
        const docSnap = await getDoc(docRef);
        try{
            if(docSnap.exists()){
                console.log("user's collection exist!")
                setIsUsercollectionExist(true)
            }else{
                console.log("user's collection no exist!")
                setupUserCollection(user)
                setIsUsercollectionExist(true)
            }
        }catch(error){
            console.error("fialed to check collection exist",error)
        }
    }   

    const handleLoginWithEmailAndPassword = async () => {
        try {
            const result = await signInWithEmailAndPassword(
                auth,
                loginInput.email,
                loginInput.password
            );
            console.log('Login successful:', result.user);
            await checkCollectionExist(result.user); 
        } catch (error) {
            console.error("Failed to login with email and password:", error);
            let errorMessage = "輸入email 或 密碼錯誤"
            // 處理錯誤代碼
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = '無效 email 格式'
                    break;
                case 'auth/wrong-password':
                     errorMessage = '無效 密碼格式'
                    break;
                case 'auth/invalid-credential':
                    errorMessage = '無效 email 或 錯誤密碼'
                    break;
                default:
                    errorMessage = `未知錯誤 ：代碼 ${error.code}`
            }
            Swal.fire({
                title:"使用者登入失敗",
                text: errorMessage,
                icon:"error"
            })  
        }
    };
    

    const handleLoginWithGoogle = ()=>{
        //打開 modal
        setIsModalOpen(true)
    }

    const fetchLogininWithGoogle = async()=>{
        setIsModalOpen(false)
        try{
            const result = await signInWithPopup(auth, provide);
            console.log("result:",result)
            await checkCollectionExist(result.user);
            
        }catch(error){

            console.error('登入錯誤', error.code)
            let errorMessage = '登入失敗，請稍後再試';
            if(error.code === "auth/cancelled-popup-request"){
                errorMessage = "請求過多受阻，請稍後再嘗試"
            }else if (error.code === "auth/popup-blocked"){
                errorMessage = "彈出視窗被阻擋，請先允許彈出視窗，並稍後再嘗試"
            }else if (error.code === "auth/popup-closed-by-user"){
                errorMessage = "彈出視窗被關閉，請稍後再嘗試"
            }else{
                errorMessage = `未知錯誤:${error.message}`
            }
            Swal.fire({
                title:"使用者登入失敗",
                text: errorMessage,
                icon:"error"
            })            
        }
    }

    useEffect(()=>{
        updateBtnDisabled(isValid, setLoginDisabled)
        if(hasUserConfirmed){
            fetchLogininWithGoogle()
        }
    },[isValid, hasUserConfirmed])


    return (
        <>
            <div>this is LoginPage!</div>
            <div>
                <form action="">
                    <input 
                        name="email"
                        type="text"
                        autoComplete="username"
                        onChange={handleInputChange}
                    />
                    <div>{validLabel.email}</div>
                    <input 
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        onChange={handleInputChange}
                    />  
                    <div>{validLabel.password}</div>
                </form>
                <button 
                    onClick={handleLoginWithEmailAndPassword}
                    disabled={loginDisabled}
                >登入
                </button>
            </div>
            <hr />
            <button onClick={handleLoginWithGoogle}>Google 按鈕</button>
            <button onClick={()=>{navigate('/signup')}}>Click to sign up</button>
            {isModalOpened ? 
                <LoginWarningModal 
                    setHasUserConfirmed={setHasUserConfirmed}
                    isModalOpened={isModalOpened}
                /> : null
            }
        </>
    )
}

export default  LoginPage;