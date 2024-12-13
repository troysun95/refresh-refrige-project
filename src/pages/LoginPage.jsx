import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {auth, provide} from "../config/firebase";
import Swal from "sweetalert2";
import {db} from "../config/firebase"
import { setDoc , getDoc, doc} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
import {  useEffect, useState } from "react";

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

    const updateBtnDisabled = ()=>{ 
        if(isValid.email && isValid.password){
            setLoginDisabled(false)
        }else{
            setLoginDisabled(true)
            console.log(loginInput.password)
        }
    }

    const updateIsItemValid = (isItemValid, itemName)=>{
        if(isItemValid){
            setIsValid((prev)=>({
                ...prev,
                [itemName]: true
            }))
        }else{
            setIsValid((prev)=>({
                ...prev,
                [itemName]: false
            }))
        }
    }

   
    //監聽 input 與 檢查
    const handleInputChange = (event)=>{
        //宣報變數儲存會使用到的物件
        const { name, value } =  event.target;
        setLoginInput((prev)=>({
            ...prev,
            [name]:value,
        }))
        //檢驗是否有效
        if(value.trim().length > 0 ){
            //email 條件
            if(name === "email") {
                //條件
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                const isValidEmail = emailRegex.test(value)
                //更新有效提示標籤
                setValidLabel((prev)=>({
                    ...prev,
                    [name] : isValidEmail ? "": "請輸入正確郵件格式"
                }))
                updateIsItemValid(isValidEmail, name)
            }else{
                const isValidPassword =  value.trim().length >= 6
                setValidLabel((prev)=>({
                    ...prev,
                    [name] : isValidPassword ? "": "請輸入 6 個以上字元"
                }))
                updateIsItemValid(isValidPassword, name)
            }
        }else{
            setValidLabel((prev)=>({
                ...prev,
                [name]: "此欄位不可為空白"
            }))
        }

    }

    const setupUserCollection = async( loginUser )=>{
        try{
            await setDoc(doc(db, "users", loginUser.uid),{
                username: loginUser.displayName,
                createdAt: new Date(),
            })
            return true
        }catch(error){
            console.error("failed to set up users collection", error)
            return false
        }
    }

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

    const handleLoginWithEmailAndPassword = async()=>{
        try{
            const result = await signInWithEmailAndPassword(
                auth, 
                loginInput.email, 
                loginInput.password
            )
            console.log('result from signInWithEmailAndPassword', result)
            await checkCollectionExist(result.user)
            
        }catch(error){
            console.error("failed to login in with email and password",error)
        }
    }


    const handleLoginWithGoogle = async()=>{
        try{
            const result = await signInWithPopup(auth, provide);
            console.log("result:",result)
            await checkCollectionExist(result.user);
        }catch(error){
            //針對報錯回傳顯示不同訊息
            console.error('登入錯誤', error.message)
            let errorMessage = '登入失敗，請稍後再試';
            if(error.message=== "Firebase: Error(auth/cancelled-popup-request)"){
                errorMessage = "請求過多受阻，請稍後再嘗試"
            }else if (error.message === "auth/popup-blocked"){
                errorMessage = "彈出視窗被阻擋，請先允許彈出視窗，並稍後再嘗試"
            }else if (error.message === "auth/popup-closed-by-user"){
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
        updateBtnDisabled()
    },[isValid])
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
        </>
    )
}

export default  LoginPage;