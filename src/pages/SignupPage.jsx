import { createUserWithEmailAndPassword, deleteUser, updateProfile } from "firebase/auth";
import { useState } from "react";
import {auth, db} from "../config/firebase"
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import { useAuth } from "../contexts/AuthContext";

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

    //input 有效檢驗
    
    //更新按鈕可點擊
    const updateBtnDisabled = ()=>{
        if(isValid.email && isValid.password && isValid.username){
            setSignupDisabled(false)
        }else{
            setSignupDisabled(true)
        }
    }

    const updateIsItemValid = (isItemValid, itemName)=>{
        if(isItemValid){
            setIsValid((prev)=>({
                ...prev,
                [itemName]:true
            }))
        }else{
            setIsValid((prev)=>({
                ...prev,
                [itemName]:false
            }))
        }
    }

    //監聽 input 
    const handleInputChange = (event) => {
        const {name, value} = event.target;
        setFormData((prev)=>({
            ...prev, 
            [name]:value
        }));
        //輸入值檢驗
        if(value.trim().length > 0){
            if(name === "email"){
                const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                const isValidEmail = emailRegex.test(value)
                setValidLabel((prev)=>({
                    ...prev,
                    [name]:isValidEmail ? '' : '請輸入正確郵件格式',
                }))
                updateIsItemValid(isValidEmail, name)
            }else if(name === "password"){
                const isValidPassword =  value.trim().length >= 6
                setValidLabel((prev)=>({
                    ...prev,
                    [name]:isValidPassword ? '' : '請輸入 6 個以上字元',
                }))
                updateIsItemValid(isValidPassword, name)
            }else{
                const usernameRegex = /^[\S]{3,}$/;
                const isValidUsername = usernameRegex.test(value);
                setValidLabel((prev) => ({
                    ...prev,
                    [name]: isValidUsername ? "" : "請輸入三個以上非特殊符號的字元",
                }));
                updateIsItemValid(isValidUsername, name)
            }
            updateBtnDisabled()
        }else{
            //不可為空白值
            setValidLabel((prev)=>({
                ...prev, 
                [name]:"此欄位不可為空白"
            }))
        }

    }

    const updateUsername = async(signupUser)=>{
        try{
            await updateProfile(signupUser, {
                displayName: formData.username,
            });
            
        }catch(err){
            console.log("failed to update username in firebase", err)
            Swal.fire({
                title:"註冊名稱失敗",
                text:"輸入名稱無法使用",
                icon:"error"
            })
        }
    }

    const setupUserCollection =async(signupUser)=>{
        try{
            await setDoc(doc(db, "users", signupUser.uid),{
                username: formData.username,
                createdAt: new Date(),
            })
            return true
        }catch(err){
            console.log("faled to setup user collection", err)
            return false
        }
    }


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
            await updateUsername(user);
            if(user.displayName === formData.username){
                stepSet.stepTwo = true;
            }
            
            // 第三步驟：設置使用者資料集合
            const isCollectionSetup = await setupUserCollection(user);
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
    
    

    return(
        <div className="signupPanel">
            {/* from 預設會用get 方法將資料純進 action 網址  */}
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
