import styles from "./HomePage.module.scss"
import { useEffect, useState } from "react";
import { 
    auth, checkDefaultStorageMarkSet, getExpiredStorageItemsByToday, 
    getAllStorageTitles, updateHasDefaultSet, createStorage,} from "../../config/firebase";
import LoadingPanel from "../../components/LoadingPanel";
import { useNavigate } from "react-router-dom";
import { Kitchen} from "@mui/icons-material"
import Navbar from "../../components/Navbar";
import ExpiredItemsPanel from './ExpiredItemsPanel';
import StorageCard from './StorageCard';

const HomePage = ()=>{
    const navigate = useNavigate()
    const user = auth.currentUser;
    const [isLoading, setIsLoading] = useState(false);
    const [storageNames, setStorageNames] = useState([]);
    const [expiredItems, setExpiredItems] = useState([]);
    //或改用useRef 
    const [itemsCount, setItmesCount] = useState();
    const [storageCreated, setStorageCreated] = useState("");
    //過期計算
    const getAllExpiredItems = async()=>{
        let allCount = 0
        const expiredItems = await Promise.all(storageNames.map(async (storageName) => {
            const data = await getExpiredStorageItemsByToday(user, storageName.storageTitle);
            if (data.length) {
                const dataObj = {[storageName.storageTitle]: data} 
                allCount += data.length;
                console.log(`${storageName.storageTitle} 項目數為： ${data.len}` )
                return dataObj
            }
            return null; 
        }))
        const filteredExpiredItems = expiredItems.filter(item => item !== null);
        console.log('印出 expired items', filteredExpiredItems, 'allCount', allCount)
        await setExpiredItems(filteredExpiredItems)
        await setItmesCount(allCount)

    }



    //監聽 item 在 storage 中被建立
    const handleItemCreated = async()=>{
        console.log("有 item 被建立！")
        await getAllExpiredItems();
    }

    //檢查預設 storage 設置 : 冷凍區, 冷藏區
    const checkDefaultStorageSetup = async()=>{
        try{
            setIsLoading(true)
            const hasDefaultStorageMarkSet = await checkDefaultStorageMarkSet(user)
            if(hasDefaultStorageMarkSet){
                setIsLoading(false)
            }else{
                //否則新增
                await createStorage(user, "冷凍區")
                await createStorage(user, "冷藏區")
                await updateHasDefaultSet(user)
                setIsLoading(false)
            }
        }catch(error){
            console.error("failed to finish default storage set up ", error)
            setIsLoading(false)
            }
    }

    const fetchAllStorageTitles =async()=>{
        const titlesArr = await getAllStorageTitles(user)
        if(titlesArr){
                const newstorageNames = titlesArr.map((item)=>({
                    storageTitle: item.storageTitle,
                    storageDocId: item.storageDocId
                }))
                setStorageNames(newstorageNames)
        }else{
            console.log('尚未有儲位建立資料')
        }
    }


    const handleCreateNewStorage = async () => {
        await createStorage(user, storageCreated)
        await fetchAllStorageTitles();
    }

    const handleStorageCreatedChanged= async(e)=>{
        e.preventDefault();
        const inputName = e.currentTarget.value;
        setStorageCreated(inputName)
    }

    
    const initializeStorages = async (user) => {
        try {
            if(user){
                //檢查預設儲位
                await checkDefaultStorageSetup();
                //取得所有儲位名稱
                await fetchAllStorageTitles();
                if(storageNames && storageNames.length){
                    //即期品 檢查
                    console.log('')
                    await getAllExpiredItems()
                }
                
            }else{
                alert('使用者資料擷取錯誤！')
            }
            
        } catch (error) {
            console.error("初始化錯誤：",error)
        }
        
    }

    useEffect(()=>{
        initializeStorages(user);
    },[user, navigate, storageNames.length])

    

    return(
        <div className={styles.homePage}>
            <div className={styles.hoemePageHeader}>
                <div className={styles.brandLogo}
                    onClick={()=>{navigate('/home')}}
                >
                    <Kitchen/>
                    <span>Refresh Refige</span>
                </div>
               </div>
            <Navbar/>
            <div className={styles.mainPanel}>
                <div className={styles.welcomePanel}>
                    <span>歡迎, 使用者: {auth?.currentUser.displayName}</span>
                </div>
                <div className={styles.mainContent}> 
                    <ExpiredItemsPanel 
                        expiredItems={expiredItems}
                        itemsCount={itemsCount}
                    />
                    <hr className={styles.mainHr}/>
                    <h3 className={styles.previewPanelTitle}>儲位預覽區 ：</h3>
                    <hr className={styles.secindaryHr}/>
                    <div className={styles.storageCardWrapper}>
                        {storageNames && storageNames.length ?(storageNames.map((storageName) => (
                                <StorageCard 
                                    key={storageName.storageDocId}
                                    storageName={storageName.storageTitle}
                                    user={user}
                                    onItemCreated={handleItemCreated}
                                />
                                ))
                            ):(
                                <div className={styles.createStoragePanel}>
                                    <h3>尚未擁有儲位，下方輸入名稱並新增</h3>
                                    <input 
                                        type="text" 
                                        value={storageCreated}
                                        onChange={handleStorageCreatedChanged}
                                    />
                                    <button type="button" onClick={handleCreateNewStorage}>新增儲位</button>
                                </div>
                            ) 
                        }
                    </div>
                </div>
            </div>
            <div className={styles.createStoragePanel}>
                <h3>輸入名稱新增儲位</h3>
                <input 
                    type="text" 
                    value={storageCreated}
                    onChange={handleStorageCreatedChanged}
                />
                {storageCreated.length ? (<button type="button" onClick={handleCreateNewStorage}>新增儲位</button>) : null}
                
            </div>
            {isLoading ? (
                <LoadingPanel 
                    panelTitle="資料處理中" 
                    panelText="正在處理資料，請稍候..."
                />):null
            }
            <div className="footer">
                <span>all right reserved</span>
            </div>
        </div>
    )
}

export default HomePage