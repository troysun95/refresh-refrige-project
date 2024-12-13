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
    const [isUsercollectionExist, setIsUsercollectionExist] = useState(false)
    // 初始化持久性設定，先進行持久性設定
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                await setPersistence(auth, browserLocalPersistence);
                console.log("持久性設定完成, auth 為：",auth);
            } catch (error) {
                console.error("持久性設定失敗:", error.code, error.message);
            }
        };

        initializeAuth();
    }, []);

    // 設置使用者登入狀態監聽 (每次啟動，包含重新整理）
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                //console.log("使用者已登入:", user);
                setIsAuthenticated(true);
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
                isUsercollectionExist,
                setIsUsercollectionExist,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
