import { createContext, useContext, useState } from "react";
const AuthContext = createContext();

export const AuthPorvider = ({children}) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const  checkHasAuthed =()=>{
        console.log('checkHasAuthed triggered')
        setPersistence(auth, browserLocalPersistence)
        .then(() => { 
        let isAuthChecked = false;
        onAuthStateChanged(auth, (user) => {
        if (!isAuthChecked) {
            if (!user) {
            console.log("尚未登入，執行登入程序; 使用 以下資料作為登入依據： auth , porvide",auth, provide);
            signInWithRedirect(auth, provide); 
            } else {
            console.log("使用者已登入", user);
            }
            isAuthChecked = true;  
        }
        });
        })
        .catch((error) => {
            console.error("Failed to set persistence:", error.code, error.message);
        });
    }

    return(
        <AuthContext.Provider value={{
            

        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const  useAuth  = ()=> useContext (AuthContext)