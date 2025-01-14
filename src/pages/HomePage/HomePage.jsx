import styles from "./HomePage.module.scss"
import { useEffect, useRef, useState } from "react";
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
    const [expiredItemsCount, setExpiredItmesCount] = useState(0);
    const [storageCreated, setStorageCreated] = useState("");

    const isFirstLogin = useRef(false)
    //過期項目

    const getAllExpiredItems = async()=>{
        if(!storageNames){
            console.log("storageNames 尚未建立！ ")
            return 
        }else{
            const expiredItems = await Promise.all(storageNames.map(async (storageName) => {
                const data = await getExpiredStorageItemsByToday(user, storageName.storageTitle);
                if (data.length) {
                    const dataObj = {[storageName.storageTitle]: data} 
                    return dataObj
                }
                return null; 
            }))
            const filteredExpiredItems = await expiredItems.filter(item => item !== null);
            console.log('所有過期項目', filteredExpiredItems)
            await setExpiredItems(filteredExpiredItems)
            await setExpiredItmesCount(filteredExpiredItems.reduce((sum, item) => sum + Object.values(item)[0].length, 0));
        }
    }

    //更新單一 storage 過期項目
    const updateStorageExpiredItems = async (storageName) => {
        const newExpiredItems = await getExpiredStorageItemsByToday(user, storageName);
        if (newExpiredItems && newExpiredItems.length > 0) { 
            setExpiredItems((prevItems) => {
                return prevItems.map((item) => {
                    const storageTitle = Object.keys(item)[0]
                    if (storageTitle === storageName) { 
                        return {[storageName]: newExpiredItems}; 
                    }
                    return item; 
                });
            });
            setExpiredItmesCount((prevCount)=> (prevCount + 1))
        }
    };
    //監聽 item 在 storage 中被建立
    const handleItemCreated = async(storageName)=>{
        console.log("有 item 被建立在儲位：, ",storageName)
        //await getAllExpiredItems();
        await updateStorageExpiredItems(storageName)
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
        console.log('fetchAllStorageTitles trigger')
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
            }else{
                alert('使用者資料擷取錯誤！')
            }
            
        } catch (error) {
            console.error("初始化錯誤：",error)
        }
        
    }

    const  fetchAllExpiredItems = async () => {
        console.log('fetchAllExpiredItems tridded')
        await getAllExpiredItems()
    }

    useEffect(()=>{
        if(!isFirstLogin.current){
            isFirstLogin.current = true
            initializeStorages(user);
        }
    },[isFirstLogin])

    useEffect(()=>{
        console.log('監聽過期項目變化', expiredItems)
    },[expiredItems])
    

    useEffect(()=>{
        fetchAllStorageTitles()
    },[])

    useEffect(()=>{
        if(storageNames && storageNames.length){
            fetchAllExpiredItems()
        }
    },[storageNames])

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
                        itemsCount={expiredItemsCount}
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