import { useEffect, useState } from "react";
import {auth, setupUserbaseCollection} from "../config/firebase";
import { signOut } from "firebase/auth";
import { getAllDatas } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
const HomePage = ()=>{
    const navigate = useNavigate()
    const [userDatas, setUserDatas]=  useState([]);
    const { setIsUsercollectionExist } = useAuth();
    const [isLoading, setIsLoading] =useState(false)
    const handleLogout = async()=>{
        try{
            console.log(`使用者${auth?.currentUser.displayName}登出`)
            setIsUsercollectionExist(false)
            await signOut(auth);
        }catch(err){
            console.log("fialed to logout")
        }
    }

    const fetchAllDatas = async()=>{
        try{
            const response = await getAllDatas();
            setUserDatas(response)
            console.log('response:',response)
        }catch(err){
            console.log("failed to fetch all datas", err)
        }
    }

    useEffect(()=>{
       console.log("確認現有 user",auth?.currentUser)
    },[])
    return(
        <>
            <h3>this is HomePage</h3>
            {/* show auth content */}
            <div>
                navabr 預定區
                 與 link of pagese
                <span>userSetting || </span>
                <button onClick={handleLogout} >Logout!</button>
            </div>
            
            <div className="userName">
                <h3>mainPanel</h3>
                <span>userName: {auth?.currentUser.displayName}</span>
                <div> 除未依覽區
                    <div>isExpiredExist ? 過期modal</div>
                    <div>儲位 1</div>
                    <div>儲位 2</div>
                    <div> + 新增儲位按鈕</div>
                </div>
                
            </div>
            
            <div>memoSIdebar 預定區</div>

        </>
    )
}

export default HomePage