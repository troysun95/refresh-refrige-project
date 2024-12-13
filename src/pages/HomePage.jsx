import { useEffect, useState } from "react";
import {auth} from "../config/firebase";
import { signOut } from "firebase/auth";
import { getAllDatas } from "../config/firebase";
import { useNavigate } from "react-router-dom";
const HomePage = ()=>{
    const navigate = useNavigate()
    const [userDatas, setUserDatas]=  useState([]);
    const handleLogout = async()=>{
        try{
            console.log(`使用者${auth?.currentUser.displayName}登出`)
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
        //嘗試拉 firebase 資料進來
        //fetchAllDatas()
    },[])
    return(
        <>
            <h3>this is HomePage</h3>
            {/* show auth content */}
            <div className="userName">
                <span>userName: {auth?.currentUser.displayName}</span>
            </div>
            <button onClick={handleLogout} >Logout!</button>
           
        </>
    )
}

export default HomePage