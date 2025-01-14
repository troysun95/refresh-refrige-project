import { createContext, useContext, useState, useEffect } from "react";
import {
    browserLocalPersistence,
    setPersistence,
    onAuthStateChanged,
} from "firebase/auth";
import { provide, auth } from "../config/firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isPersistSet, setIsPersistSet] = useState(false)
    const [isUserSettingExist, setIsUserSettingExist] = useState(false)
    
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                await setPersistence(auth, browserLocalPersistence);
                console.log('持久性設定完成');
            } catch (error) {
                console.error("持久性設定失敗:", error.code, error.message);
            }
        };

        initializeAuth();
    }, []);

    //監聽若沒有登出，維持登入狀態
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsAuthenticated(true);
                //新增延續 isUserSetting 驗證 , 或使用 ref 紀錄就好
                setIsUserSettingExist(true);
                if(!isPersistSet){
                    setPersistence(auth, browserLocalPersistence);
                    setIsPersistSet(true)
                }else{
                    console.log(`isPersistSet 為 ${isPersistSet}`)
                }
            } else {
                console.log("尚未登入");
                setIsAuthenticated(false);
            }
        });

        return unsubscribe; // 清理監聽器
    }, []);


    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                setIsAuthenticated,
                isUserSettingExist,
                setIsUserSettingExist,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
