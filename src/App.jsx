import styles from "./App.module.scss"
import { BrowserRouter, Routes,Route, Navigate } from "react-router-dom";
import {
  LoginPage,
  HomePage,
  ErrorPage,
  SignupPage,
  StoragePage,
} from "./pages/index";
import { useAuth } from "./contexts/AuthContext";
import { useEffect, useState } from "react";
import {NavigatePageProvider} from './contexts/NavigatePageContext'
function App() {
  const {
    isAuthenticated,
    isUserSettingExist,
  } = useAuth();
  
  const PrivateRoute = ({children})=>{
    return (isAuthenticated && isUserSettingExist) ? children : <Navigate to='/login' />
  }

  const PublicRoute = ({children})=>{
    return (isAuthenticated && isUserSettingExist)  ? <Navigate to='/home' replace/> : children
  }

  const [isDarkMode, setIsDarkMode] = useState(false);
  //檢驗現有驗證狀態
  useEffect(()=>{
    //監聽驗證
    console.log('isAuthenticated: ', isAuthenticated)
    console.log('isUserSettingExist: ', isUserSettingExist)
    if(isDarkMode){
      document.documentElement.classList.add('dark-mode')
    }else{
      document.documentElement.classList.remove('dark-mode')
    }
  },[isAuthenticated, isUserSettingExist, isDarkMode])
  
  return (
    <>
      <BrowserRouter>
        <NavigatePageProvider>
        <div className={styles.appContainer}>
            <Routes>
              {/* 私路由 */}
              <Route path="/home" element={
                <PrivateRoute>
                  <HomePage/>
                </PrivateRoute>
              }/>
              <Route path="/storage/:storageName" element={
                <PrivateRoute>
                  <StoragePage/>
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
        </NavigatePageProvider>
      </BrowserRouter>
    </>
  );
}

export default App;
