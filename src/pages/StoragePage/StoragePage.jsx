import { useParams } from 'react-router-dom';
import styles from './StoragePage.module.scss';
import BrandHeader from '../../components/BrandHeader';
import Navbar from '../../components/Navbar';
import ItemModal from './ItemModal';
import {  useEffect, useState , useCallback} from 'react';
import { deleteItemById, getStorageSortedItems, fetchStorageSearchData, 
} from '../../config/firebase';
import {auth} from '../../config/firebase'
import {  formateDateFromJS, getFormatedDate } from '../../fn';
import { 
     Search, CommentRounded, Close, Tune, Photo,
} from '@mui/icons-material';
import clsx from 'clsx';
import Swal from 'sweetalert2';

const StoragePage = ()=>{
    const user = auth.currentUser;
    const {storageName} = useParams();
    const storageId = localStorage.getItem('storageId')
    //子元件 ：item modal
    const [isToCreate, setIsToCreate] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalItemId, setModalItemId] = useState();
    const [isItemsLoading, setIsItemLoading] = useState({
        type: "initial",
        isLoading: false,
    });
    
    const filterOptions =[
        "最近建立",
        "最快過期",
    ]

    //排序 :
    //單次呼叫 items 數量
    const limitNumber = 2;
    const [sortBy, setSortBy ] = useState(filterOptions[0])
    //搜尋
    const [searchShow, setSearchShow] = useState(false)
    //輸入值
    const [searchInfo, setSearchInfo] = useState({
        searchBy: "name",
        input: "",
        sortOfTime: "created_at",
        duration: "week",
    })

    const [isSearchFilterOn, setIsSearchFilterOn] = useState(false)
    
    //不同排序 items 、 搜尋的 items 結果 、 items 預計渲染 
    const [itemsBySort, setItemsBySort] = useState({
        "最近建立": {items:[],lastSortValue: null, hasMore: true, hasDefaultFetched : false, needUpdate: false, },
        "最快過期": {items:[],lastSortValue: null, hasMore: true, hasDefaultFetched : false, needUpdate: false, },
    })
    
    const [itemsContent, setItemsContent] = useState({

        items: null,
        hasMore: false, 
        lastSortValue: null,
        error: ''
    })
    //滾動
    //const scrollContainterRef  = useRef(null);
    //選取多項
    const [groupIds, setGroupIds] = useState([])

   
    //click item
    const handleClickItem = (itemId)=>{
        if(itemId && typeof(itemId) === "string"){
            
            setModalItemId(itemId);
            setIsModalOpen(true)
            setIsToCreate(false)
        }else{
            console.log('回傳 itmemId 資料類型不符！', typeof(itemId))
        }
    }

    const handleClickSortBy = async(e)=>{
        const sortType = e.target.innerText;
        if(sortType){
            setSortBy(sortType)
            handleSwitchSortBy(sortType)
        }else{
            console.log('sortType 沒有點擊成功',sortType)
        }
        
    }

    //從資料庫拉取資料，並更新至 itemsContent  與 itemsBySort
    const updateItemsOfState = async(sortType, itemsNumber) => {
        try{
            const response = await fetchItemsBySort(sortType, itemsNumber);
            
            if(response.status === "failed"){
                console.log('更新 items 狀態失敗:', response.errorMsg);
            }else{


                setItemsContent((prevItems)=>{
                    return(
                        {
                            ...prevItems,
                            items: response.newItems,
                            hasMore: response.hasMore,
                            lastSortValue: response.lastSortValue,
                        }
                    )
                })
        
        
                setItemsBySort((prevItemsBySort) => ({
                    ...prevItemsBySort,
                    [sortType]: {
                        ...prevItemsBySort[sortType],
                        items: response.newItems,
                        hasMore: response.hasMore,
                        lastSortValue: response.lastSortValue,
                        hasDefaultFetched: true ,  
                        needUpdate: false,
                    },
                }));
            }
            
        }catch(error){
            console.error('更新 items 狀態時發生錯誤:', error);
        }
     



        

    }

    //切換資料排序
    const handleSwitchSortBy= async(sortType)=>{
        //根據 hasDefaultFetched 判斷是否為第一筆
        console.log('handleItemsBySort triggered by sortType:', sortType)
        

        if(itemsBySort[sortType].hasDefaultFetched){

            if(!itemsBySort[sortType].needUpdate){
                
                console.log(`itemsBysort${sortType} 已經有資料，無需更新`, itemsBySort[sortType])

                setItemsContent((prev)=>({
                    ...prev,
                    items: itemsBySort[sortType].items,
                    hasMore: itemsBySort[sortType].hasMore,
                    lastSortValue : itemsBySort[sortType].lastSortValue,
                }))


            }else{
                console.log(`sortBy : ${sortType} 需要更新資料`)  
               
                await updateItemsOfState(sortType, limitNumber);

            }



        }else{
            console.log(`${sortBy} 首次更新資料`)

            await updateItemsOfState(sortType, limitNumber);
        }
    }

    //formate items(arranged) 
    const getformatedItems = (items)=>{
        const formatedData = items.map((item)=>{
            const formateditem = {
                ...item,
                created_at: getFormatedDate(item.created_at),
                expired_date : getFormatedDate(item.expired_date),
                isChecked: false,
            }
            return formateditem
        })
        return formatedData
    }


    //新增 items
    const handleCreateItem = ()=>{
        setIsModalOpen(true)
        setIsToCreate(true)
        setModalItemId("")
    } 

    const fetchItemsBySort = async(sortType, itemsNumber)=>{
        
        console.log('傳入請求數量:',   itemsNumber)

        let items = []
        let hasMoreData = false
        let lastSortValue = itemsBySort[sortType].lastSortValue || null
    
        setIsItemLoading(true)
        console.log('fetchItemsBySort trigger by sortType', sortType)
        try {

            let response ;

            switch (sortType) {
                
                case "最近建立":
                    response = await  getStorageSortedItems(
                        user, storageId,"created_at", true,
                        itemsNumber, itemsBySort[sortType].lastSortValue
                    )
                    break;
                default:
                    response = await  getStorageSortedItems(
                        user, storageId,  "expired_date", false,
                        itemsNumber, itemsBySort[sortType].lastSortValue
                    )
                    break;
            }

            setIsItemLoading(false)

            if(response.status === "success"){
                items = response.data || [] ; 
                hasMoreData = response.hasMore ;
                lastSortValue = response.lastSortValue ; 
            }

            const formateditems = getformatedItems(items)
            
            return {
                status: "success",
                newItems: formateditems,
                hasMore : hasMoreData,
                lastSortValue : lastSortValue,

            }
        } catch (error) {
            console.error(`獲取排序 : sort ${sortType} 失敗`,error)
            setIsItemLoading(false)
            return {
                status: "failed",
                newItems: null
            }
        }
    }


    


    //加載下一筆資料
    const getMoreData = async()=>{ 
        console.log("getMoreData triggered")
        let response ;
        if(searchShow){
            console.log('搜尋模式下，獲取更多資料')
            // response = await fetchStorageSearchData (
            //     user, storageId, limitNumber, searchInfo.searchBy, "desc", 
            //     setSearchInfo.sortOfTime,  itemsContent.lastSortValue,
            // )

            response = await fetchStorageSearchData(
                user, storageId, limitNumber, itemsContent.lastSortValue,
            )
            const updatedItems = [
                ...itemsContent.items,
                ...response.newItems
            ]
            setItemsContent({
                items: updatedItems,
                hasMore: response.hasMore,
                lastSortValue: response.lastSortValue
            })
        }else{
            response = await fetchItemsBySort(sortBy, limitNumber)

            if(response.status === "success"){
                const updatedItems = [
                    ...itemsContent.items,
                    ...response.newItems
                ]
                console.log('updatedItems', updatedItems )
                if(updatedItems){
                    setItemsBySort((prevItems)=>({
                        ...prevItems,
                        [sortBy]:{
                            //其他東西照常
                            ...prevItems[sortBy],
                            items:  updatedItems,
                            hasMore: response.hasMore,
                            lastSortValue: response.lastSortValue,
                        }
                    }))
                    setItemsContent({
                        items: updatedItems,
                        hasMore: response.hasMore,
                        lastSortValue: response.lastSortValue
                    })
                }else{
                    console.log('文件更新錯誤, updatedItems 為空')
                    return
                }
            }else{  
                Swal.fire({
                    icon:"error",
                    title:"項目加載失敗",
                    text:"請稍後再試"
                })
            
                return
            }
        }
    }   


    //處理因改變項目，而重新排序
    const reArrangeItems = async(newItems, sortBy)=>{

        const sortKey = sortBy === '最近建立' ? "created_at" : "expired_date";
        const sortOrderDesc = sortBy === '最近建立';
        
        try{
            const response = await getStorageSortedItems(
                user, storageId, sortKey, sortOrderDesc,
                1, itemsBySort[sortBy].lastSortValue
            );


            if(response.status !== "success" || !response.data){
                console.log('取得資料失敗')
                return  {
                    status: "failed",
                    data:null,
                }
            }
    
    
            const nextItem = response.data[0]
    
            //檢查是否有因為總資料數為 1 時，取重複資料狀況

            if(!nextItem || newItems.some(item => item.id === nextItem.id)){
                console.log('無下一筆項目, 無需重新排序')
                return  {
                    status: "success",
                    data: newItems,
                }
            }

            const formatedNextItem = {
                ...nextItem,
                created_at: getFormatedDate(nextItem.created_at),
                expired_date: getFormatedDate(nextItem.expired_date),
            }
    
            console.log('下一筆項目：', formatedNextItem)
    
            
            const updatedItems=[
                ...newItems,
                formatedNextItem
            ]
            
    
            updatedItems.sort((a, b) => {
                const valA = new Date(a[sortKey]);
                const valB = new Date(b[sortKey]);
                return sortOrderDesc ? (valB - valA) : (valA - valB);
            });
    
    
            const arrangedSortKey = updatedItems.map((item)=> item[sortKey])
            if(!updatedItems){
                console.log('更新後的項目為空，無需更新')
                return;
            }else{

                console.log(`重新排列 ${sortKey}`, arrangedSortKey)
            }

            return {
                status:"success",
                data : updatedItems.slice(0, updatedItems.length - 1)
            }

        }catch(error){
            console.log('未成功取的下一筆資料進行排序',error)
            return {
                status:"failed",
                data :null
            }
        }
        
        
    }





    //處理完再傳進去
    const  updateItemsAfterChange = async(
        newItems,
        sortBy,
     )=> {


        console.log('setState items :', newItems)
        setItemsContent((prevContent) => {
            return {
                ...prevContent,
                items: newItems 
            }
        });


        setItemsBySort((prevSort) => ({
            
            [sortBy]: { 
                ...prevSort[sortBy],
                items: newItems, 
            },

            //將其他 sortBy 的 needUpdate 改為 true
            ...Object.keys(prevSort).reduce((acc, key) => {
                if(key !== sortBy){
                    acc[key] = {
                        ...prevSort[key],
                        needUpdate: true,
                    };
                }
                return acc;
            }
            , {}),
        }));  
    }

          
    const handleItemCreated = async (newItem, itemId) => {
        if (!newItem || !itemId) {
            console.log('item  新增失敗 : newItem : ', newItem, 'id:', itemId);
            return;
        }

        const newItemFormated = {
            ...newItem,
            id: itemId,
            itemId: itemId,
            created_at: formateDateFromJS(newItem.created_at),
            expired_date: formateDateFromJS(newItem.expired_date),
        };

        const newItems = [
            ...itemsContent.items,
            newItemFormated,
        ]

        const response =  await reArrangeItems(newItems, sortBy)


        if(response.status !== "success"){
            console.log("重新排序失敗")
            return
        }else{
            await updateItemsAfterChange(response.data, sortBy)
        }

    
    };
   
    const handleItemUpdated = async(itemId, updatedItem) => {
        console.log('項目更新成 :', updatedItem ,'itemId', itemId);
        

        if(!sortBy){
            console.log('目前沒有選中的排序方式')
            return ;
        }
       

        //日期格式化的  updatedItem
        const formatedUpdatedItem = {
            ...updatedItem,
            id:itemId,
            itemId: itemId,
            created_at: formateDateFromJS(updatedItem.created_at),
            expired_date: formateDateFromJS(updatedItem.expired_date),
        }


        //沒有修改的 items
        const itemsRemain = itemsContent.items.filter((item) => item.id !== itemId);

        console.log('itemsRemain: ',   itemsRemain)

        const newItems = [
            ...itemsRemain,
            formatedUpdatedItem,
        ]

        console.log('修改後 items :', newItems)
        //現有 items 重新排列
        const response =  await reArrangeItems(newItems, sortBy)


        if(response.status !== "success"){
            //排序失敗或是沒有下一筆，無需排序
            console.log("取得下一筆項目失敗，排序失敗")
            return
        }else{
            await updateItemsAfterChange(response.data, sortBy)
        }
        
    }

    const handleDeleteGroup = async () => {
        
        if(!groupIds.length){
            return 
        }

        const deleteResults = await Promise.allSettled(
            groupIds.map(async (itemId) => {
                const isDeleted = await deleteItemById(user, itemId);
                if (isDeleted === "failed") {
                    throw new Error(`Failed to delete item with ID: ${itemId}`);
                }
                return itemId; 
            })
        );
    
        let allSuccessful = true;
        const failedItemIds = [];
        const successfulItemIds = [];
    
        deleteResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                successfulItemIds.push(result.value);
            } else {
                allSuccessful = false;
                failedItemIds.push(groupIds[index]);
                console.error(`Error deleting item ${groupIds[index]}: ${result.reason}`);
            }
        });
    
        if (!allSuccessful) {
            alert(`部分項目刪除失敗！`);
            console.log(`以下項目刪除失敗: ${failedItemIds.join(', ')}`);
        } else {
            alert(`選取項目成功刪除！`);
        }
    

        const itemsLeft  = itemsContent.items.filter(item => !successfulItemIds.includes(item.id));
    

        await updateItemsAfterChange(itemsLeft, sortBy)

        setGroupIds(()=>{
            const remainingIds = groupIds.filter(id => !successfulItemIds.includes(id));
            return remainingIds;
        })

    }


    //輸入 input 搜尋
    const handleSearchItems = async () => { 

        if(searchInfo.input.trim().length <= 0){
            console.log('搜尋輸入值為空')
            return
        }

        setSearchShow(true)

        //簡化查詢
        const response = await fetchStorageSearchData(
            user, storageId, searchInfo.input, limitNumber,
        )

        if(response.status === "success"){
            //先進行時間轉換
            const formatedData = response.data.map((item)=>{
                return({
                    ...item,
                    created_at: getFormatedDate(item.created_at),
                    expired_date: getFormatedDate(item.expired_date),
                })
            })
            setItemsContent((prev)=>({
                ...prev,
                items:  formatedData, 
                hasMore: response.hasMore,
                lastSortValue: response.sortAfter
            }))
        }else{
            console.log(`搜尋 ${searchInfo.input}失敗`)
            setItemsContent((prev)=>({
                ...prev,
                items:  [], 
                hasMore:null,
                lastSortValue: null,
                errorMsg: response.errorMsg,
            }))
        }

    }

    //關閉搜尋結果
    const handleCloseSearch = ()=>{
        setSearchShow(false)
        setItemsContent((prev)=>({
            ...prev,
            items: itemsBySort[sortBy].items,
            hasMore: itemsBySort[sortBy].hasMore,
            lastSortValue: itemsBySort[sortBy].lastSortValue,
        }))
    }

   

    //fetchItemsByDefault：首次頁面渲染用
    const fetchItemsByDefault = useCallback(async()=>{

        setIsItemLoading((prev)=>({
            ...prev,
            type:"fetched",
            isLoading: true,
        }))

        if(storageName){
            const  response = await  getStorageSortedItems(
                user, storageId, "created_at", true,
                limitNumber, 
            )
            
            if(response.status === "success"){
                const formatedData = await getformatedItems(response.data);

                console.log('檢查傳入資料格式', formatedData)

                setItemsBySort((prev)=>({
                    ...prev,
                    "最近建立":{
                        items: formatedData,
                        hasDefaultFetched: true,
                        ne: true,
                        hasMore: response.hasMore,
                        lastSortValue : response.lastSortValue,
                    }
                }))
                setItemsContent({
                    items: formatedData, 
                    hasMore: response.hasMore, 
                    lastSortValue: response.lastSortValue,
                    error: ""
                })
                setIsItemLoading((prev)=>({
                    ...prev,
                    type:"fetched",
                    isLoading: false
                }))

            }else{
                Swal.fire({
                    title: "載入儲位項目失敗",
                    text: response.errorMsg,
                    icon:"error"
                })

                setItemsBySort((prev)=>({
                    ...prev,
                    "最近建立":{
                        items: [],
                        ne: true,
                        hasDefaultFetched: true,
                    }
                }))
                setItemsContent((prev)=>({
                    ...prev, 
                    items: [],
                    hasMore: false,
                    lastSortValue: null,
                    error: response.errorMsg,
                }))
                
                setIsItemLoading((prev)=>({
                    ...prev,
                    type:"fetched",
                    isLoading: false
                }))
            }
        }else{
            console.log(`StorageCard ${storageName} 無正確傳入`,storageName)
            setIsItemLoading(false)
            
        } 
    },[storageName,user,storageId])

    //勾選:刪除

    const updateItemId = (
        e, 
        itemId
    )=>{
        const isItemChecked = e.target.checked
        const isIdInGroup = groupIds.includes(itemId)
        let newGroupIds = []

        if (isItemChecked && !isIdInGroup) {
            newGroupIds = [...groupIds, itemId]; 
        } else if (!isItemChecked && isIdInGroup) {
            newGroupIds = groupIds.filter(item => item !== itemId);
        } else {
            newGroupIds = groupIds; 
        }
    
        setGroupIds(newGroupIds)
    }

    //點擊取得 id
    const handleCheckboxClick = (e) => {
        e.stopPropagation();
    };
    
    //用於 checkbox 變換
    const handleItemSelected = (e,itemId) => {
        
        if (!itemId) {
            console.log('點擊項目沒有對應id,點擊項目為 :', e);
            return;
        } else {
            updateItemId(e, itemId);
        }
    };


    const selectAllItems =(e)=>{
        if(!itemsContent){
            console.log('itemsContent 不存在', itemsContent)
            return 
        }

        const isChecked = e.target.checked;

        const newIdsToAdd = itemsContent.items
            //提出 id
            .map((item) => item.id)
            //篩選不包含在裡面的
            .filter(id => !groupIds.includes(id));

        if(isChecked){
            if(newIdsToAdd.length > 0){
            setGroupIds((prevIds)=> {
                const newIds = [
                    ...prevIds,
                    ...newIdsToAdd,
                ]
                return newIds
            })
        }
        }else{
            setGroupIds([])
        }
    }

    //頁面首次渲染:預設排序
    useEffect(()=>{
        fetchItemsByDefault();
    },[storageName,fetchItemsByDefault])
    


    return(
        <>
            <div 
                className={styles.storagePage} 
            >
                <BrandHeader/>
                <Navbar/>
                <div className={styles.mainPanel}>
                    <div className={styles.storgeTitle}>
                        <h3>儲位： {storageName}</h3>
                    </div>
                    <div className={clsx(styles.searchPanel, {[styles.searchPanelOnFilter]:isSearchFilterOn})}>
                        <input 
                            type="text"
                            placeholder="輸入搜尋名稱"
                            onChange={(e)=>{
                                setSearchInfo((prevInfo)=>({
                                    ...prevInfo,
                                    input: e.target.value
                                }))
                            }}
                        />
                        <div 
                            className={styles.iconContainer}
                            onClick={handleSearchItems}
                        >
                            <Search className={styles.searchIcon}/>
                            
                        </div>
                        <div 
                            onClick={()=>{
                                setIsSearchFilterOn(!isSearchFilterOn)  
                            }}
                        >
                            <Tune className={styles.tuneIcon}
                            />
                        </div>

                        {/* {isSearchFilterOn ? (
                            <div className={styles.searchFilterPanel}>
                                <div>
                                    <label>搜尋欄位</label>
                                    <select name="" id="" 
                                        onChange={(e)=>{
                                            setSearchInfo((prev)=>({
                                                ...prev,
                                                searchBy: e.target.value,
                                            }))
                                        }}
                                    >
                                        <option  value="name">名稱</option>
                                        <option  value="notes">備註</option>
                                    </select>   
                                </div>
                                {searchInfo.searchBy && (
                                    <>
                                        <div>
                                            <span>時間排序依照</span>
                                            <select name="" id=""
                                                onChange={(e)=>{
                                                    setSearchInfo((prev)=>({
                                                        ...prev,
                                                        sortOfTime: e.target.value,
                                                    }))
                                                }}
                                            >
                                                
                                                <option value="created_at">建立日期</option>
                                                <option value="expired_date">到期日期</option>
                                            </select>
                                        </div>
                                        <div>
                                            <span>時間間隔</span>
                                            <select name="" id=""
                                                onChange={(e)=>{
                                                    setSearchInfo((prev)=>({
                                                        ...prev,
                                                        duration: e.target.value,
                                                    }))
                                                }}
                                            >
                                                <option value="today">今天</option>
                                                <option value="week">一週內</option>
                                                <option value="month">一個月內</option>
                                            </select>
                                        </div>
                                    </>
                                    
                                )}
                            </div>
                        ):null} */}
                    </div>
                    {searchShow ? (
                        <>
                                <div className={styles.searchInfoPanel}>
                                    搜尋
                                    <div  className={styles.infoBanner}>
                                        <span>{searchInfo.input}</span>
                                    </div>
                                    的結果 : 
                                    
                                    <div 
                                        onClick={handleCloseSearch}  
                                    >
                                        <Close className={styles.closeIcon}/>
                                    </div>
                                </div>
                                <hr />
                            </>
                        ): (
                                <div className={styles.arrangePanel}>
                                    <div className={styles.arrangeBanner}>
                                        {filterOptions.map((sortType, index)=>(
                                            <div key={`filterBtn${ index }`}> 
                                                <div 
                                                    className={clsx(styles.arrangeBtn, {[styles.arrangeBtnClicked]:sortBy === sortType})}
                                                    onClick={handleClickSortBy}
                                                >
                                                    {sortType} 
                                                        
                                                </div>
                                                <span> ({itemsBySort[sortType].items.length})</span>
                                                <span>{itemsBySort[sortType].hasDefaultFetched > 0 ? '1st' : 'X 1st'}</span>
                                                <span> ; </span>
                                                <span>{itemsBySort[sortType].hasDefaultFetched > 0 ? '已-最新' : '未-最新'}</span>
                                            </div > 
                                        ))}
                                    </div>
                                </div>
                        )}
                    <div className={styles.storageItemsWrapper}>
                        <div 
                            className={styles.itemsBtnPanel}
                        >
                            {itemsContent.items.length  && (
                                <input 
                                    type="checkbox" 
                                    style={{cursor:"pointer"}}
                                    onClick={selectAllItems}
                                />
                            )}
                            {!searchShow  && (
                                <button
                                    onClick={handleCreateItem}

                                >
                                    新增項目
                                </button>
                            )}
                            
                            {groupIds.length > 0 && (
                                    <button
                                    onClick={handleDeleteGroup}
                                    className={styles.delteItemsBtn}
                                >
                                    <span>刪除項目</span>
                                    {groupIds.length > 0 && 
                                        <span>
                                            (
                                                {groupIds.length}
                                            )
                                        </span>
                                    }
                                </button>
                            )}

                        </div>

                        {/* itemsPanel */}
                        <div className={styles.itemsPanel}>
                            {isItemsLoading.type !== "inintial"  && (
                                    (itemsContent.items && itemsContent.items.length  > 0 )?  (
                                        itemsContent.items.map((item)=>{
                                            return (
                                                <div 
                                                    className={clsx(styles.itemCard, {[styles.itemCardSelected]: groupIds.includes(item.id)})}
                                                    data-item-id={item.itemId}
                                                    key={item.itemId}
                                                >   
                                                    <input
                                                        type="checkbox"
                                                        className={styles.itemCheckbox}
                                                        onClick={handleCheckboxClick}
                                                        onChange={(e)=>handleItemSelected(e, item.itemId)} 
                                                        checked={groupIds.includes(item.itemId)}
                                                    />
                                                    <div 
                                                        className={styles.cardInfo}
                                                        data-item-id={item.itemId}
                                                        onClick={()=>handleClickItem(item.itemId)}
                                                    >
                                                        <div className={styles.cardTitle}>
                                                            <span className={styles.itemName}>
                                                                {item.name}
                                                            </span>
                                                        </div>
                                                        <div className={styles.cardSubTitle}>
                                                            <div className={styles.cardAmount}>
                                                                <span className={styles.itemAmount}>
                                                                    {item?.amount}
                                                                </span>
                                                            </div>
                                                            <div className={styles.cardUnit}>
                                                                <span className={styles.itemUnit}>
                                                                    {item?.unit}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <div className={styles.cardDateContainer}>
                                                            <span className={styles.expiredDate}>
                                                                {item?.expired_date} 到期
                                                            </span>
                                                            <span>
                                                                {item?.created_at} 建立
                                                            </span>
                                                        </div>
                                                        {item.label && (
                                                            <div className={styles.itemLabel}>
                                                                {item.label}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={styles.iconPanel}>
                                                        {item.notes && (
                                                            <div>
                                                                <CommentRounded/>
                                                            </div>
                                                        )}
                                                        {item.image && (
                                                            <div>
                                                                <Photo/>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    ):(
                                        <div 
                                            className={styles.noItemPanel}
                                        >
                                            {searchShow ? (
                                                itemsContent.errorMsg ? "項目搜尋失敗" : `沒有符合 ${searchInfo.input} 名稱的項目`
                                            ) : (
                                                itemsContent.errorMsg ? "項目讀取失敗" : "目前儲位沒有項目"
                                            )}
                                        </div>
                                    )
                                )
                            }
                            <hr />
                            <div className={styles.moreDataPanel}>
                                {itemsContent.hasMore.length ? (
                                    <div
                                        onClick={()=>{
                                        getMoreData()
                                    }}>
                                        點擊載入更多資料
                                    </div>
                                ) : (
                                    <div>無更多項目</div>
                                )}
                            </div> 
                        </div>
                        
                    </div>
                </div>
                    {isModalOpen && (
                        <>
                            <div className={styles.modalMask}></div>
                            <ItemModal
                                storageId={storageId}
                                isToCreate={isToCreate}
                                setIsModalOpen={setIsModalOpen}
                                modalItemId={modalItemId}
                                onItemUpdated={handleItemUpdated}
                                onItemCreated={handleItemCreated}
                                isModalOpen={isModalOpen}
                            />
                        </>
                    )}
                
            </div>
        </>
    )
}

export default StoragePage;


