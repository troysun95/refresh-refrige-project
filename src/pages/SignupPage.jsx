import { createUserWithEmailAndPassword, deleteUser, sendEmailVerification } from "firebase/auth";
import { auth, updateUsername, setupUserCollection, validSingupEmail } from "../config/firebase";
import { updateBtnDisabled } from "../fn";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";


const SignupPage = () => {
    const navigate = useNavigate();
    const { setIsUsercollectionExist } = useAuth();

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

    const handleSignUp = async (e) => {
        e.preventDefault();

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const newUser = userCredential.user;
            setUser(newUser);
            await validSingupEmail(newUser);
            alert("請至註冊 email 信箱點擊驗證網址，完成註冊流程")
            setHasVerifyEmailSent(true);
            setStepSet((prev) => ({
                ...prev,
                stepOne: true,
            }));
        } catch (error) {
            Swal.fire({
                title: "註冊失敗",
                text: "帳戶建立失敗，請檢查輸入資訊",
                icon: "error",
            });
            console.error("註冊流程中發生錯誤", error.message);
            setHasVerifyEmailSent(false);
        }
    };

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
        }
    };

    const fetchUsercollectionSetup = async () => {
        try {
            const isCollectionSetup = await setupUserCollection(user, formData.username);
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
        }
    };


    const handleCheckEmailVerified = async()=>{
        await user.reload();
        if(auth.currentUser?.emailVerified){
            console.log('firebase 以登記註冊郵件完成驗證')
            await fetchUsernameUpdate()
            await fetchUsercollectionSetup();
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
        updateBtnDisabled(isValid, setSignupDisabled);
    }, [isValid]);


    useEffect(()=>{
        if(hasVerifyEmailSent){
            if(stepSet.stepOne && stepSet.stepTwo && stepSet.stepThree ){
                setIsUsercollectionExist(true)
                Swal.fire({
                    title:'註冊成功',
                    text : `使用者 ${auth.currentUser.displayName} 資料庫已初始化`, 
                    icon:"success"
                })
            }else{
                console.log("步驟未完成，檢查 ：",stepSet.stepOne , stepSet.stepTwo , stepSet.stepThree)
            }
        }
        if(stepSet.stepOne){
            console.log("step 1 set!")
        }else if(stepSet.stepTwo){
            console.log("step 2 set!")
        }else if (stepSet.stepTwo) {
            console.log("step 3 set!")
        }else{
            console.log('none step set !')
        }
    },[stepSet, navigate])


    useEffect(()=>{
        console.log("hasVerifyEmailSent is ", hasVerifyEmailSent)
    },[hasVerifyEmailSent])
    return (
        <div className="signupPanel">
            <form onSubmit={handleSignUp}>
                <label>
                    email :
                    <input
                        type="email"
                        value={formData.email}
                        name="email"
                        onChange={handleInputChange}
                    />
                    <div className="email-hints">請輸入可以接收驗證信件的 email </div>
                    <div className="validCheckBox">{validLabel.email}</div>
                </label>
                <label>
                    password :
                    <input
                        type="password"
                        value={formData.password}
                        name="password"
                        onChange={handleInputChange}
                    />
                    <div className="validCheckBox">{validLabel.password}</div>
                </label>
                <label>
                    username :
                    <input
                        type="text"
                        value={formData.username}
                        name="username"
                        onChange={handleInputChange}
                    />
                    <div className="validCheckBox">{validLabel.username}</div>
                </label>
                <button
                    className="signUpBtn"
                    type="submit"
                    disabled={signupDisabled}
                >
                    註冊
                </button>
            </form>
            <button onClick={() => navigate('/login')}>回到登入頁面</button>
            {/* <button onClick={handleDeleteUser}>delete user signup</button> */}
            {stepSet.stepOne ? <button onClick={handleCheckEmailVerified}> 完成email驗證請點擊 </button> : null}
            {stepSet.stepOne ? <button onClick={handleSendVerifyEmail}> 點擊重新寄送驗證信 </button> : null}
        </div>
    );
};

export default SignupPage;
