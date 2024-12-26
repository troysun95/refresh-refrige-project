import styles from "./HomePage.module.scss"
import { useEffect, useState } from "react";
import {auth, createStorage,  getStorageAllDatas,  getUserSetting } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";
import { signOut } from "firebase/auth";
import LoadingPanel from "../components/LoadingPanel";
const HomePage = ()=>{

    const { setIsUsercollectionExist } = useAuth();
    const user = auth.currentUser;
    const [userSetting, setUserSetting] = useState();
    const [isLoading, setIsLoading] = useState(false)
    
    const handleLogout = async()=>{
        try{
            console.log(`使用者${auth?.currentUser.displayName}登出`)
            setIsUsercollectionExist(false)
            await signOut(auth);
        }catch(err){
            console.log("fialed to logout")
        }
    }

    
    const fetchUserSetting =async()=>{
        setIsLoading(true)
        const response = await getUserSetting(user);
        if(response){
            setUserSetting(response)
        }
        
    }


    const handleCreateStorge =async()=>{
        await createStorage(user, "freezer")
    }


    const handleGetStorgeAllData =async()=>{
        const datas = await getStorageAllDatas(user, "freezer")
        console.log('get all datas:', datas)
        
    }

    useEffect(()=>{
       console.log("確認現有 user",auth?.currentUser)
       //檢查是否有預設的 storage Collections
        
    },[])

    return(
        <div className={styles.homePage}>
            {/* show auth content */}
            <div className={styles.navbar}>
                navabr 預定區 
                <span>頁面link</span>
                {/* <div>
                    
                </div> */}
                <button onClick={handleLogout} >Logout!</button>
            </div>
            
            <div className={styles.mainPanel}>
                <span>歡迎, 使用者: {auth?.currentUser.displayName}</span>
                <div> Storage一覽區
                    <div>isExpiredExist ? 過期儲物警告modal
                        <div>點擊打開</div>
                    </div>
                    
                    <div>
                        儲位 1 :
                        <div className={styles.storageInfo}>
                            
                        </div>
                        <div>
                            <h3>快速建立：</h3>
                            <div>
                                <label>名稱：<input type="text" /></label>
                                <label>數量：<input type="text" /></label>
                                <label>到期日期：<input type="date" /></label>
                            </div>
                            <button>加入儲位 1</button>
                        </div>
                        <div>pinned? storage</div>
                    </div>
                    <button> + 新增儲位按鈕 </button>
                </div>
            </div>
            <div className={styles.testPanel}>
                <button 
                    onClick={handleCreateStorge}
                >
                    建立 freezer
                </button>
                <button 
                    onClick={handleGetStorgeAllData}
                >
                    讀取 freezer items
                </button>
            </div>
            {isLoading ? (
            <LoadingPanel 
                panelTitle="資料處理中" 
                panelText="正在處理資料，請稍候..."
            />):null}
            
        </div>
    )
}

export default HomePage