import styles from "./LoginPage.module.scss";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {auth, provide, setupUserSetting} from "../config/firebase";
import { updateBtnDisabled } from "../fn";
import Swal from "sweetalert2";
import {db} from "../config/firebase"
import { getDoc, doc} from "firebase/firestore";
import {  useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {Kitchen, Close} from "@mui/icons-material";

const LoginWarningModal = ({setHasUserConfirmed, setIsModalOpen})=>{

    const handleConfirmUpdate =()=>{
        setHasUserConfirmed(true)
    }

    return(
            <div className={styles.loginWarningModal}>
                <div 
                    className={styles.modaTitle}
                    onClick={()=>{setIsModalOpen(false)}}
                >
                    <h3>同步警告</h3>
                    <Close className={styles.modalCloseBtn}/>
                </div>
                <div className={styles.modalInform}>

                    <p>若曾使用此郵件註冊過，使用 Google 登入將同步 Google 資訊並覆蓋現有資料 (如：username, 使用者頭像 等)。</p> 
                </div>
                <div className={styles.modalBtnPanel} >
                    <div>
                        <span> 是否繼續？</span>
                    </div>
                    <div>
                        <button onClick={()=>{
                            setIsModalOpen(false)
                        }}>取消</button>
                        <button onClick={handleConfirmUpdate}>確定</button>
                    </div>
                    
                </div>
            </div>
    )
}

const LoginPage =({setIsDarkMode, isDarkMode})=>{
    const navigate = useNavigate();
    const {setIsUserSettingExist} = useAuth()
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
    const [ loginDisabled, setLoginDisabled] = useState(true)
    const [ hasUserConfirmed, setHasUserConfirmed] = useState(false)
    const [ isModalOpened, setIsModalOpen]= useState(false)
    
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        let validationMessage = "";
        let isFieldValid = false;
    
        if (value.trim().length === 0) {
            validationMessage = "此處不可以為空白";
        } else {
            if (name === "email") {
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                isFieldValid = emailRegex.test(value);
                validationMessage = isFieldValid ? "" : "請輸入正確郵件格式";
            } else if (name === "password") {
                isFieldValid = value.trim().length >= 6;
                validationMessage = isFieldValid ? "" : "請輸入 6 個以上字元"
            }
        }
    
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


    const checkUserSettingExist = async(user) => {
        //console.log("檢查 userSetting 文件 ?存在")
        if(!user){
            throw new Error("使用者登入尚未成功")
        }
        const docRef = doc(db, "users",user.uid, "userSetting", "userSetting")
        const docSnap = await getDoc(docRef);
        try{
            if(docSnap.exists()){
                setIsUserSettingExist(true)
            }else{
                setIsUserSettingExist(false)
                await setupUserSetting(user, user.email, user.displayName)
                setIsUserSettingExist(true)
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
            await checkUserSettingExist(result.user);
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
        setIsModalOpen(true)
    }

    
    const fetchLogininWithGoogle = async()=>{
        setIsModalOpen(false)
        try{
            const result = await signInWithPopup(auth, provide);
            await checkUserSettingExist(result.user);
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
        
    },[isValid, hasUserConfirmed, loginDisabled, navigate])


    return (
        <div className={styles.loginWrapper}>
            <div className={styles.brandContainer}>
                <div className={styles.brandTitle}>Refresh Refrige</div>
                <div className={styles.branLogoContainer}>
                    <Kitchen className={styles.brandLogo}/>
                </div>
            </div>
            <div className={styles.loginContainer}>
                <form action="">
                    <label >郵件 : </label>
                    <input 
                        name="email"
                        type="text"
                        autoComplete="username"
                        onChange={handleInputChange}
                    />
                    <div className={styles.validLabel}>{validLabel.email}</div>
                    <label >密碼 : </label>
                    <input 
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        onChange={handleInputChange}
                    />  
                    <div className={styles.validLabel} >{validLabel.password}</div>
                </form>
                <button 
                    onClick={handleLoginWithEmailAndPassword}
                    disabled={loginDisabled}
                    className={styles.loginBtn}
                >登入
                </button>
            </div>
            <hr style={{margin:"10px 5px"}}/>
            <div className={styles.loginBtnPanel}>
                <div className={styles.fastLogin}>
                    <div> 或 </div>
                    <button className={styles.googleFastLogin}onClick={handleLoginWithGoogle}>Google 快速登入</button>
                    {/* 快速登入警告視窗 */}
                    {isModalOpened ? 
                        <LoginWarningModal 
                        setHasUserConfirmed={setHasUserConfirmed}
                        setIsModalOpen={setIsModalOpen}
                        /> : null
                    }   
                </div>
                <div className={styles.toSginPagePanel}>
                    尚未註冊？ 前往<button onClick={()=>{navigate('/signup')}}>  註冊頁面</button>
                </div>               
            </div>
            <div className={styles.publicNavbar}>
                <button onClick={()=>{
                    setIsDarkMode(!isDarkMode)
                }}>{isDarkMode ? "換淺色模式"  : "換深色模式"}</button>
            </div>
        </div>            
    )
}

export default  LoginPage;