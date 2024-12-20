import styles from "./App.module.scss"
import { BrowserRouter, Routes,Route, Navigate } from "react-router-dom";
import {
  LoginPage,
  HomePage,
  ErrorPage,
  SignupPage,
} from "./pages/index";
import { useAuth } from "./contexts/AuthContext";
import { useEffect, useState } from "react";

function App() {
  const {
    isAuthenticated,
    isUsercollectionExist,
  } = useAuth();
  
  const PrivateRoute = ({children})=>{
    return (isAuthenticated && isUsercollectionExist) ? children : <Navigate to='/login' />
  }

  const PublicRoute = ({children})=>{
    return (isAuthenticated && isUsercollectionExist)  ? <Navigate to='/home' replace/> : children
  }

  const [isDarkMode, setIsDarkMode] = useState(false);
  //檢驗現有驗證狀態
  useEffect(()=>{
    //只是要印出來看
    console.log('isAuthenticated: ', isAuthenticated)
    console.log('isUsercollectionExist: ', isUsercollectionExist)
    if(isDarkMode){
      document.documentElement.classList.add('dark-mode')
    }else{
      document.documentElement.classList.remove('dark-mode')
    }
  },[isAuthenticated, isUsercollectionExist, isDarkMode])
  
  return (
    <>
      <BrowserRouter>
        <div className={styles.appContainer}>
          <Routes>
            {/* 私路由 */}
            <Route path="/home" element={
              <PrivateRoute>
                <HomePage/>
              </PrivateRoute>
            }/>
            {/* 公路由 */}
            <Route path="/login" element ={
              <PublicRoute>
                <LoginPage
                  isDarkMode={isDarkMode} 
                  setIsDarkMode={setIsDarkMode}
                />
              </PublicRoute>
            }/>
             <Route path="/signup" element ={
              <PublicRoute>
                <SignupPage/>
              </PublicRoute>
            }/>
            {/* 404錯誤頁面 */}
            <Route path="*" element={<ErrorPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </>
  );
}

export default App;
