import styles from "./HomePage.module.scss"
import { useEffect, useRef, useState, useCallback } from "react";
import { 
    auth, createStorage,getAllStorages, 
    //fetchStorageExpiredItems,
    getUserSetting, setupItemsCollection,
} from "../../config/firebase";
import Navbar from "../../components/Navbar";
import InintailSettingModal from "./InintailSettingModal";
//import ExpiredItemsPanel from './ExpiredItemsPanel';
import StorageCard from './StorageCard';
import BrandHeader from '../../components/BrandHeader';
import {AddCircleOutline} from "@mui/icons-material"
//skeleton
import Skeleton from '@mui/material/Skeleton';
import Swal from "sweetalert2";
import clsx from "clsx";
//test area

const HomePage = ()=>{
    //state
    const user = auth.currentUser;
    const [isLoading, setIsLoading] = useState({
        allStorages: false,
        expiredPanel: false,
    });
    //fetchAllstorage 觸發？
    const [hasStorageNamesFetched, setHasStorageNamesFetched] = useState(false)
    const [storageNames, setStorageNames] = useState([]);
    //const [expiredItems, setExpiredItems] = useState([]);
    //const [expiredItemsCount , setExpiredItemsCount] = useState(0)
    // const [fetchError, setFetchError] = useState({
    //     allStorages: false,
    //     expiredPanel: false,
    // })
    const [storageCreated, setStorageCreated] = useState("");
    const [checkMsg, setCheckMsg]= useState({
        type: "",
        text: ""
    })
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    //initailize
    const [hasDefaultSet, setHasDefaultSet]=  useState(false)
    const [inintialState , setInintialState] = useState({
        isModalOpen:{
            isModalOpen :false,
        },
        hasUserGet: false,
        refrige: { 
            isLoading: false,
            hasSet: false,
        },
        freezer: {
            isLoading: false,
            hasSet: false,
        },
        itemsInitialized : false,
    })
    //紀錄 initial 完成
    const isInitialized = useRef(false);

    //初始化設置
    //先檢查 
   

    const initializeStorages = useCallback( async ( storageTitle, storageType)=> {
        try {
        setInintialState((prev)=>({
                ...prev,
                [storageType]:{
                    isLoading: true,
                    hasSet: false,
                }
        })) 
        const response = await createStorage(user, storageTitle);

        setInintialState((prev)=>({
                ...prev,
                [storageType]:{
                    isLoading: false,
                    hasSet: response === "success" ? true : false
                }
            }))
        } catch (error) {
            console.error(`儲位 ${storageTitle}初始化建立失敗：`,error)
            if(error.message){
                setInintialState((prev)=>({
                    ...prev,
                    [storageType]:{
                        isLoading: true,
                        hasSet: false,
                        errorState: "reInitailze"
                    }
            })) 
            }else{
                setInintialState((prev)=>({
                    ...prev,
                    [storageType]:{
                        isLoading: true,
                        hasSet: false,
                        errorState: "unknown"
                    }
            })) 
            }
        }
    },[user])
       


    const initializeItems = useCallback(async()=>{
        const response = await setupItemsCollection(user)
        if(response.status === "success"){
            setInintialState((prev)=>({
                ...prev,
                itemsInitialized: true
            }))
        }
    },[user])
    



    const checkHasUserStorageInitailized = useCallback(async()=>{
        console.log("checkHasUserStorageInitailized trigger")
        try {
            if(user && user.uid){
                const hasDefaultInitialize = localStorage.getItem('hasDefaultInitialize')
                if(hasDefaultInitialize){
                    setHasDefaultSet(true)
                }else{
                    const {data, status} = await getUserSetting(user)

                    if(status === "failed"){
                        console.error('userSetting 取得失敗')
                        return 
                    }

                    setInintialState((prev)=>({
                        ...prev,
                        hasUserGet: true,
                    }))
                    const hasDefaultStorageSet = data.hasDefaultStorageSet;
                    if(hasDefaultStorageSet === true){
                        setHasDefaultSet(true)
                    }else{
                        initializeStorages("冷藏區", "refrige");
                        initializeStorages("冷凍區", "freezer");
                        initializeItems()
                    }
                }
                

            }else{
                console.log("使用者資料無效！")
                Swal.fire({
                    title: '使用者資料無效！',
                    text:"請重新登入, 取得有效使用者資料",
                    icon: "error"
                })
            }
        } catch (error) {
            console.error("檢測儲位初始化失敗",error)
            Swal.fire({
                title: '檢測初始化失敗',
                text:"請稍後再嘗試",
                icon: "error"
            })
        }
    },[user, initializeItems, initializeStorages])

    //再次設置預設
    const reInintailzeStorage = async(stoargeTitle, storageType)=>{
        initializeStorages(user,stoargeTitle, storageType)
    }



    //storage
    const fetchAllStorages = useCallback(async()=>{
        setIsLoading((prev)=>({
            ...prev,
            allStorages: true
        }))
        setHasStorageNamesFetched(true)
        //loading 緩衝
        setTimeout(async () => {
            const response = await getAllStorages(user);
            // if (status === "failed") {
            //     setFetchError((prev) => ({
            //         ...prev,
            //         allStorages: true,
            //     }));
            // } else {
                
            // }

            const storageList = response.data.map((item) => ({
                    storageTitle: item.storageTitle,
                    id: item.id,
                }));

                setStorageNames(storageList);
            setIsLoading((prev) => ({
                ...prev,
                allStorages: false,
            }));
        }, 500)
    },[user])
        

    const handleTitleInputChange= async(e)=>{
        e.preventDefault();
        const inputName = e.currentTarget.value;
        if(inputName){
            checkIsTitleExist(inputName)
        }
        setStorageCreated(inputName)
    }

    const checkIsTitleExist =(storageTitle)=>{
        const storageTitles = storageNames.map(item => item.storageTitle)
        const isExist =  storageTitles.includes(storageTitle)
        if(isExist){
            setCheckMsg({
                type: "error",
                text:"儲位名稱已經被使用"
            })
        }else{
            setCheckMsg({
                type:"",
                text:""
            })
        }
    }

    const handleCreateStorage = async () => {
        setCheckMsg((prev)=>({
            ...prev,
            type: "",
            text: "儲位新增中"
        }))
        const response = await createStorage(user, storageCreated)

        if(response === "success"){
            setCheckMsg((prev)=>({
                ...prev,
                type: "",
                text: "儲位新增成功"
            }))
            await fetchAllStorages();
            setIsCreateModalOpen(false)
            setStorageCreated("")
        }else{
            setCheckMsg((prev)=>({
                ...prev,
                type: "error",
                text: "儲位新增失敗"
            }))
        }
        
    }

  
    //監聽子元件 : storage update || delete 
    const handleStorageChanged = async()=>{
        if(!storageNames){
            console.log("目前沒有儲位資料！")
            return
        }
        await fetchAllStorages();
    }
    

    //過期檢查:所有項目
//    const getAllExpiredItems = useCallback(async()=>{
//         console.log("getAllExpiredItems triggered")
//         setIsLoading((prev)=>({
//             ...prev,
//             expiredPanel: true,
//         }))
//         let allItemsCount = 0;
//         try {
//             const itemsInfo = await Promise.all(
//                 storageNames.map(async(item)=>{
//                     const response = await fetchStorageExpiredItems(user, item.id, 10, "today");
//                     if(response.status === "success"){
//                         allItemsCount += item.totalCount;
//                         return {
//                             storageId: item.id, 
//                             items: response.data ,
//                             hasMore :response.hasMore,
//                             lastSortValue: response.lastSortValue,
//                             storageTitle : item.storageTitle,
//                             totalCount: item.totalCount,
//                         } ; 
//                     }else{
//                         setFetchError((prev)=>({
//                             ...prev,
//                             expiredPanel: true,
//                         }))
//                         return {
//                             storageId: item.id, 
//                             error: response.error
//                         }
//                     }
//                 })
//         )
//         setExpiredItems(itemsInfo)
//         setExpiredItemsCount(allItemsCount)
//         setIsLoading((prev)=>({
//             ...prev,
//             expiredPanel: false}))
//         } catch (error) {
//             console.error("fetch 過期項目失敗", error)
//         }
//     },[storageNames, user])
   

//    const recheckStorageItems =  async(storageId) =>{
//         try {
//             const response = await fetchStorageExpiredItems(user, storageId, 10, "today")
//             if(response.status === "failed"){
//                 setExpiredItems()
//             }else{
//                 setExpiredItems((prevItems)=>{
//                     return prevItems.map((item)=>{
//                       if(item.id === storageId){
//                         return {
//                             storageId :item.id,
//                             items: response.data,
//                             hasMore: response.hasMore,
//                             lastSortValue : response.lastSortValue,
//                             error: ""
//                         }
//                       } 
//                       return item;
//                     })
//                 })

//             }
//         } catch (error) {
//             console.error("過期項目重新讀取失敗", error)
//         }
//    }


//    const getLastsortValue = (storageId) =>{
//         if(!expiredItems || !storageId){
//             console.log('expiredItems 設置 state 失敗')
//             return
//         }

//         if( !storageId){
//             console.log('storageId 不存在 或 傳入失敗')
//             return
//         }
        
//        const foundItem = expiredItems.find((item)=> item.storageId === storageId)
//        return foundItem ? foundItem.lastSortValue : null;
//     }

//    const getMoreStorageExpiredItems = async(storageId)=>{
//         try {
//            const lastSortValue =  getLastsortValue(storageId)
//            if(!lastSortValue){
//             console.log('載入更多依據讀取失敗 或 不存在',lastSortValue)
//            }
//            const response = await fetchStorageExpiredItems(user, storageId, 10, "today", lastSortValue)

//            if(response.status === "failed"){
//             console.log("讀取更多過期項目失敗")
//            }else{
//             setExpiredItems((prevItems)=>{
//                 return prevItems.map((item)=>{
//                     if(item.storageId === storageId){
//                         return {
//                             ...item,
//                             items: [...item.items, ...response.data],
//                             hasMore: response.hasMore,
//                             lastSortValue : response.lastSortValue
//                         }
//                     }else{
//                         return item
//                     }
//                 })
//             })
//            }
//         } catch (error) {
//             console.error("載入更多過期項目失敗",error)
//         }
//    }

//    const handleButtonClicked = (storageId, name)=>{
//     if(name === "recheck"){
//         recheckStorageItems(storageId)
//     }else{
//         getMoreStorageExpiredItems(storageId)
//     }
//    }    




    useEffect(() => {
        if (user && !isInitialized.current) {
            setTimeout(() => {
                checkHasUserStorageInitailized();
            }, 500);
            
            isInitialized.current = true; 
        } else {
            console.log('使用者資料載入中');
        }
    }, [user, checkHasUserStorageInitailized]);


    useEffect(()=>{
        if(hasDefaultSet){

            fetchAllStorages();
        }
    },[hasDefaultSet, fetchAllStorages])

    // useEffect(()=>{
    //     if(storageNames.length > 0){
    //         getAllExpiredItems()
    //     }
    // },[storageNames, getAllExpiredItems])




if (isLoading.allStorages) {
    return (
        <div className={styles.homePage}>
            <BrandHeader/>
            <Navbar/>
            <div 
                className={styles.mainPanel}
            >
                <div className={styles.welcomePanel}>
                    <span>歡迎, 使用者: {auth?.currentUser.displayName}</span>
                </div>
                
                <div className={styles.mainContent}> 
                    {/* 過期物品區 */}
                    <div>
                        <Skeleton variant="text" width={200}/> 
                    </div>

                    <hr className={styles.mainHr}/>
                    <h3 className={styles.previewPanelTitle}>儲位預覽區 ：</h3>
                    <hr className={styles.secindaryHr}/>
                    {/* 儲位預覽區 */}
                    <div className={styles.storageCardWrapper}>
                        <div className={styles.storageCard}>
                            <div className={styles.cardTitlePanel}>
                                <Skeleton variant="text" width={400}  height={20}/>
                            </div>
                            <div className={styles.previewItemsPanel}>
                                <Skeleton variant="rectangular" width={400} height={230} />
                            </div>
                            <div style={{marginTop: "50px"}}>
                                <Skeleton variant="rectangular" width={200} height={50} />
                            </div>
                        </div>
                        <div className={styles.storageCard}>
                            <div className={styles.cardTitlePanel}>
                                <Skeleton variant="text" width={400}  height={20}/>
                            </div>
                            <div className={styles.previewItemsPanel}>
                                <Skeleton variant="rectangular" width={400} height={230} />
                            </div>
                            <div style={{marginTop: "50px"}}>
                                <Skeleton variant="rectangular" width={200} height={50} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

    return(
        <div className={styles.homePage}>
            <BrandHeader/>
            <Navbar/>
            {!hasDefaultSet  ? (
                <InintailSettingModal
                    user={user}
                    inintialState={inintialState}
                    onReInitialize={reInintailzeStorage}
                    setHasDefaultSet={setHasDefaultSet}
                />
            ):null}
            <div 
                className={styles.mainPanel}
            >
                <div className={styles.welcomePanel}>
                    <span>歡迎, 使用者: {auth?.currentUser.displayName}</span>
                </div>
                
                <div className={styles.mainContent}> 
                    {/* 過期物品區 */}
                    {/* <ExpiredItemsPanel 
                        isLoading={isLoading}
                        fetchError={fetchError}
                        expiredItems={expiredItems}
                        expiredItemsCount={expiredItemsCount}
                        onButtonClicked={handleButtonClicked}

                    /> */}
                    <hr className={styles.mainHr}/>
                    <h3 className={styles.previewPanelTitle}>儲位預覽區 ：</h3>
                    <hr className={styles.secindaryHr}/>
                    {/* 儲位預覽區 */}
                    <div className={styles.storageCardWrapper}>
                        {storageNames && storageNames.length ?(storageNames.map((storageName) => (
                                <StorageCard 
                                    id={storageName.id}
                                    key={storageName.id}
                                    storageTitle={storageName.storageTitle}
                                    user={user}
                                    onStorageChanged={handleStorageChanged}
                                />
                                ))
                            ):null 
                        }
                        {storageNames && (
                            isCreateModalOpen ? (
                                <>
                                    <div className={styles.createStorageModal}>
                                        <h3> 輸入儲位名稱</h3>
                                        <hr />
                                        <input 
                                            type="text" 
                                            value={storageCreated}
                                            onChange={handleTitleInputChange}
                                        />
                                        <div className={styles.errorMsgPanel}>
                                            <span style={{color: `${checkMsg.type === "error" ? "red": "black"}`}}>
                                                {checkMsg?.text}
                                            </span>
                                        </div>
                                        <div className={styles.createBtnPanel}>
                                            <button 
                                                className={styles.cancelBtn} 
                                                onClick={()=>{
                                                    setStorageCreated("")
                                                    setIsCreateModalOpen(false)
                                                }}
                                            >取消
                                            </button>
                                            <button
                                                className={clsx(styles.createBtnNotAllowed, {[styles.confirmBtn] : (checkMsg.text) === "" && (storageCreated.length > 0)})}
                                                onClick={handleCreateStorage}
                                            >新增
                                            </button>
                                        </div>
                                        
                                    </div>
                                    <div className={styles.modalMask}></div>
                                </>
                            ) : (
                                // 這一段在 render 期間不應該出現！先 fetched，再利用 storageNames 分
                                hasStorageNamesFetched && (
                                    <div className={styles.toCreateStoragePanel}>
                                        <h3>
                                            {storageNames && storageNames.length > 0  && !isLoading.allStorages ? "新增儲位" : "尚未有儲位，點擊按鈕新增"}
                                        </h3>
                                        <div
                                            className={styles.addBtnContainer}
                                            onClick={()=>{
                                                setIsCreateModalOpen(true)
                                            }}
                                        >
                                            <AddCircleOutline 
                                                style={{fontSize: "70px"}}
                                            />
                                        </div>
                                    </div>
                                )
                               
                            )
                        )}
                    </div>
                </div>
            </div>
            
        </div>
    )
}

export default HomePage