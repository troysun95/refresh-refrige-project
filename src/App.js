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
    isAuthenticated
  } = useAuth();
  
  const PrivateRoute = ({children})=>{
    return isAuthenticated ? children : <Navigate to='/login' />
  }

  const PublicRoute = ({children})=>{
    return isAuthenticated ? <Navigate to='/home' replace/> : children
  }

  //檢驗現有驗證狀態
  useEffect(()=>{
    console.log('isAuthenticated: ', isAuthenticated)
  },[isAuthenticated])
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

            {/* <Route path="/login" element={isAuthenticated ? <HomePage/> : <LoginPage/>}/>
            <Route path="/signup" element={<SignupPage/>}/> */}

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
            <Route path="*" element={<ErrorPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </>
  );
}

export default App;
