// import { onAuthStateChanged, signInWithRedirect } from "firebase/auth";
// import { createContext, useContext, useEffect, useState } from "react";
// import { auth,provide } from "../config/firebase";

// const AuthContext = createContext();

// export const AuthPorvider = ({children}) => {
//     const [isAuthenticated, setIsAuthenticated] = useState(false);


//     //設定 若符合條件, 判斷為已驗證
//     const checkHasAuthenticated = ()=>{
//         try{
//             onAuthStateChanged(auth, (user)=>{
//                 if(user){
//                     console.log('已有使用者登入：', user)
//                     setIsAuthenticated(true)
//                 }else{
//                     console.log('尚未有使用者登入')
//                     signInWithRedirect(auth, provide)
//                 }
//             })
//         }catch(err){
//             console.log("failed to load function ")
//         }
        
//     }

//         // context 載入時，使用者登入狀態監聽
//         useEffect(() => {
//             const unsubscribe = onAuthStateChanged(auth, (user) => {
//                 if (user) {
//                     console.log("使用者已登入:", user);
//                     setIsAuthenticated(true);
//                 } else {
//                     console.log("尚未登入");
//                     setIsAuthenticated(false);
//                 }
//             });
    
//             return unsubscribe; // 清理監聽器
//         }, []);
    

//     return(
//         <AuthContext.Provider value={{
//             isAuthenticated,
//             setIsAuthenticated,
//             checkHasAuthenticated
//         }}>
//             {children}
//         </AuthContext.Provider>
//     )
// }

// export const  useAuth  = ()=> useContext (AuthContext)




//ver 2.0 , 改寫 驗證
import { createContext, useContext, useState, useEffect } from "react";
import {
    browserLocalPersistence,
    setPersistence,
    onAuthStateChanged,
    // signInWithRedirect,
} from "firebase/auth";
import { provide, auth } from "../config/firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // 初始化持久性設定
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                await setPersistence(auth, browserLocalPersistence);
                console.log("持久性設定完成");
            } catch (error) {
                console.error("持久性設定失敗:", error.code, error.message);
            }
        };

        initializeAuth();
    }, []);

    // 設置使用者登入狀態監聽, 並設置驗證狀態
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("使用者已登入:", user);
                setIsAuthenticated(true);
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
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
