import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import styles from './SignupPage.module.scss';
import { 
    auth, 
    updateUsername,  
    validSingupEmail, 
    setupUserSetting,
} from "../config/firebase";
import { updateBtnDisabled } from "../fn";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";


const SignupPage = () => {
    const navigate = useNavigate();
    const { setIsUserSettingExist } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: ''
    });

    const [validLabel, setValidLabel] = useState({
        email: '',
        password: '',
        username: ''
    });

    const [isValid, setIsValid] = useState({
        email: false,
        password: false,
        username: false,
    });

    const [signupDisabled, setSignupDisabled] = useState(true);
    const [hasVerifyEmailSent, setHasVerifyEmailSent] = useState(false);
    const [stepSet, setStepSet] = useState({
        stepOne: false,
        stepTwo: false,
        stepThree: false,
    });
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false)

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        let validationMessage = "";
        let isFieldValid = false;

        if (value.trim().length === 0) {
            validationMessage = "此處不可以為空白";
        } else {
            switch (name) {
                case "email":
                    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                    isFieldValid = emailRegex.test(value);
                    validationMessage = isFieldValid ? "" : "請輸入正確郵件格式";
                    break;
                case "password":
                    isFieldValid = value.trim().length >= 6;
                    validationMessage = isFieldValid ? "" : "請輸入 6 個以上字元";
                    break;
                case "username":
                    const usernameRegex = /^[\S]{3,}$/;
                    isFieldValid = usernameRegex.test(value.trim());
                    validationMessage = isFieldValid ? "" : "請輸入 3 個以上英數字元，並請勿使用空格";
                    break;
                default:
                    break;
            }
        }

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setValidLabel((prev) => ({
            ...prev,
            [name]: validationMessage,
        }));
        setIsValid((prev) => ({
            ...prev,
            [name]: isFieldValid,
        }));
    };
 
    //step 1
    const handleSignUp = async (e) => {
        e.preventDefault();
        setIsLoading(true)
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const newUser = userCredential.user;
            setUser(newUser);
            await validSingupEmail(newUser);
            console.log("請至註冊 email 信箱點擊驗證網址，完成註冊流程")
            setStepSet((prev) => ({
                ...prev,
                stepOne: true,
            }));
            console.log('step one set')
            setHasVerifyEmailSent(true);
        } catch (error) {
            console.error("註冊流程中發生錯誤", error.code);
            let errorMessage = "帳戶建立失敗，請檢查輸入資訊"
            if(error.code === "auth/email-already-in-use") {
                errorMessage = "email 已經註冊或是曾使用 Google 快速登入"
            }
            Swal.fire({
                title: "註冊失敗",
                text: errorMessage,
                icon: "error",
            });
            setIsLoading(false)
        }
    };

    //step 2
    const fetchUsernameUpdate = async () => {
        try {
            await updateUsername(user, formData.username, "未完成使用者登錄", "輸入名稱無效");
            setStepSet((prev) => ({
                ...prev,
                stepTwo: true,
            }));
            console.log("step 2 set!")
        } catch (error) {
            await deleteUser(user);
            setIsLoading(false)
        }
    };

    //step 3
    const fetchSetupUserSetting = async () => {
        if(user && formData){
            try {
                const isCollectionSetup = await setupUserSetting(
                    user, 
                    formData.email,
                    formData.username
                )
                setStepSet((prev) => ({
                    ...prev,
                    stepThree: isCollectionSetup,
                }))
                console.log("step 3 set!")
            } catch (error) {
                await deleteUser(user);
                Swal.fire({
                    title: "資料庫未建立成功",
                    text: "請重新註冊帳戶",
                    icon: "error",
                });
                setIsLoading(false)
            }
        }
    }


    const handleCheckEmailVerified = async()=>{
        await user.reload();
        if(auth.currentUser?.emailVerified){
            console.log('firebase 已經登記註冊郵件並完成驗證')
            await fetchUsernameUpdate()
            await fetchSetupUserSetting();
        }else{
            console.log('註冊郵件尚未完成驗證，請稍後再試')
        }
    }

    const handleSendVerifyEmail = async()=>{
        try{
            await validSingupEmail(user);
        }catch(error){
            console.error("failed to send verification  to signup email", error)
        }
    }

    useEffect(() => {
        if(isValid > 0){
            console.log('呼叫切換disabled')
        }
        updateBtnDisabled(isValid, setSignupDisabled, isLoading);
    }, [isValid, isLoading]);



    useEffect(()=>{
        console.log('監聽到刷新頁面行為')
    },[navigate])

    return (
        <div className={styles.singupPage}>
            <div className={styles.signupTitle}>
                <h3>註冊加入</h3>
                <h3 className={styles.brandTitle}>Refresh Refrige</h3>
            </div>
            <div className={styles.signupInputPanel}>
                    <label>
                        郵件 :
                        <input
                            type="email"
                            value={formData.email}
                            name="email"
                            onChange={handleInputChange}
                            placeholder="請輸入可以接收驗證信件的郵件地址"
                        />
                        <div className={styles.validLabel}>{validLabel.email}</div>
                    </label>
                    <label>
                        密碼 :
                        <input
                            type="password"
                            value={formData.password}
                            name="password"
                            onChange={handleInputChange}
                        />
                        <div className={styles.validLabel}>{validLabel.password}</div>
                    </label>
                    <label>
                        使用者名稱 :
                        <input
                            type="text"
                            value={formData.username}
                            name="username"
                            onChange={handleInputChange}
                        />
                        <div className={styles.validLabel}>{validLabel.username}</div>
                    </label>
            </div>
            <div className={styles.signupBtnPanel}>
                    <div
                        className={styles.signupBtn}
                        disabled={signupDisabled}
                        onClick={(e)=>{handleSignUp(e)}}
                    >
                        {isLoading ? "註冊進行中": "註冊"}
                    </div>
                    <div className={styles.verifyBtnPanel}>
                        {isLoading ? <button type="button" onClick={handleCheckEmailVerified}> 已點擊email驗證，繼續完成註冊 </button> : null}
                        {isLoading ? <button type="button" onClick={handleSendVerifyEmail}> 點擊重新寄送驗證信 </button> : null}
                    </div>
                    <button
                        type="button"
                        className={styles.toLogniPage}
                        onClick={() => navigate('/login')}
                    >前往 登入頁面
                    </button>
            </div>
        </div>
    );
};

export default SignupPage
