import { BrowserRouter, Routes,Route, Navigate } from "react-router-dom";
import {
  LoginPage,
  HomePage,
  ErrorPage,
  SignupPage,
} from "./pages/index";
import { useAuth } from "./contexts/AuthContext";
import { useEffect } from "react";

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

  //檢驗現有驗證狀態
  useEffect(()=>{
    //只是要印出來看
    console.log('isAuthenticated: ', isAuthenticated)
    console.log('isUsercollectionExist: ', isUsercollectionExist)
  },[isAuthenticated, isUsercollectionExist])
  return (
    <>
      <BrowserRouter>
        <div className="app">
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
                <LoginPage/>
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
