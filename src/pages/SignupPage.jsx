import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import {auth, updateUsername, setupUserCollection} from "../config/firebase"
import { updateBtnDisabled } from "../fn";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
//import { doc, setDoc } from "firebase/firestore";

const SignupPage = () => {
    //儲存format 的 state
    const navigate = useNavigate();
    const {setIsUsercollectionExist} = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: ''
    });
    const [validLabel, setValidLabel] = useState({
        email: '',
        password: '',
        username: ''
    })
    //在設置一個 判斷註冊發送的 state 
    const [isValid ,setIsValid] = useState({
        email: false,
        password: false,
        username:false,
    })
    const [signupDisabled , setSignupDisabled] = useState(true)

    

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
                    isFieldValid = usernameRegex.test(value);
                    validationMessage = isFieldValid ? "" : "需要有至少 3 個以上非特殊字元";
                    break;
                default:
                    break;
            }
        }
    
        // 更新三個 state
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
    
        const stepSet = {
            stepOne: false,
            stepTwo: false,
            stepThree: false,
        };
        //宣告變數作為儲存回傳使用者資訊
        let user = null; 
    
        try {
            // 第一步驟：建立帳戶
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            //更新註冊 使用者 資料
            user = userCredential.user; 
            stepSet.stepOne = true;
    
            // 第二步驟：更新使用者名稱
            await updateUsername(user,formData.username, "註冊名稱無效", "輸入名稱無法使用" );
            if(user.displayName === formData.username){
                stepSet.stepTwo = true;
            }
            
            // 第三步驟：設置使用者資料集合
            const isCollectionSetup = await setupUserCollection(user, formData.username);
            stepSet.stepThree = isCollectionSetup;
    
            // 所有步驟完成，顯示成功訊息
            if (stepSet.stepOne && stepSet.stepTwo && stepSet.stepThree){
                Swal.fire({
                    title: "註冊成功",
                    text: `使用者：${user.displayName} 完成登錄，並已建立資料庫`,
                    icon: "success",
                });
                //這邊沒有設置 UserCollection 檢測
                setIsUsercollectionExist(true)
                navigate('/home'); 
            }else{
                throw new Error("部分步驟未完成");
            }
        } catch (error) {
            if (!stepSet.stepOne) {
                // 第一步驟失敗，針對回傳進行分流
                Swal.fire({
                    title: "註冊失敗",
                    text: "帳戶建立失敗，請檢查輸入資訊",
                    icon: "error",
                });
            } else if (!stepSet.stepTwo) {
                // 第二步驟失敗
                if (user) {
                    try {
                        await deleteUser(user.uid);
                        Swal.fire({
                            title: "未完成使用者登錄",
                            text: "使用者名稱更新失敗",
                            icon: "error",
                        });
                    } catch (deleteError) {
                        console.error("刪除帳戶失敗", deleteError);
                        Swal.fire({
                            title: "帳戶重置失敗",
                            text: "請聯絡客服支援",
                            icon: "error",
                        });
                    }
                }
            } else if (!stepSet.stepThree) {
                // 第三步驟失敗
                if (user) {
                    try {
                        await deleteUser(user.uid);
                        Swal.fire({
                            title: "資料庫未建立成功",
                            text: "請重新註冊帳戶",
                            icon: "error",
                        });
                    } catch (deleteError) {
                        console.error("刪除帳戶失敗", deleteError);
                        Swal.fire({
                            title: "帳戶重置失敗",
                            text: "請聯絡客服支援",
                            icon: "error",
                        });
                    }
                }
            }
            console.error("註冊流程中發生錯誤", error.message);
        }
    };
    
    

    //切換按紐 disabled
    useEffect(()=>{
        updateBtnDisabled(isValid, setSignupDisabled)
    },[isValid])

    return(
        <div className="signupPanel">
            <form onSubmit={handleSignUp}>
                <label>email : 
                    <input type="email"
                        value={formData.email} 
                        name="email"
                        onChange={handleInputChange}
                    />
                    <div className="validCheckBox">
                        {validLabel.email}
                    </div>
                </label>
                <label>password : 
                    <input type="password" 
                        value={formData.password}
                        name="password"
                        onChange={handleInputChange}
                    />
                </label>
                <div className="validCheckBox">
                        {validLabel.password}
                    </div>
                <label>username : 
                    <input type="text" 
                        value={formData.username}
                        name="username"
                        onChange={handleInputChange}
                    />
                    <div className="validCheckBox">
                        {validLabel.username}
                    </div>
                </label>
                <button 
                    className="signUpBtn" 
                    type="submit"
                    onClick={handleSignUp}
                    disabled={signupDisabled}
                >
                   註冊
                </button>
            </form>
            <button onClick={()=>{navigate('/login')}}>回到登入頁面</button>
        </div>
    )
}

export default SignupPage;
