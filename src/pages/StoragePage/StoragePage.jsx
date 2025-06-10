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
    //const [limitNumber, setLimitNumber] = useState(2)
    const limitNumber = 2;
    const [arrangeClicked, setArrangeClicked ] = useState(filterOptions[0])
    //搜尋
    const [searchShow, setSearchShow] = useState(false)
    //輸入值
    const [searchInfo, setSearchInfo] = useState({
        searchBy: "",
        input: "",
        sortOfTime: "create_at",
        duration: "week",
    })

    const [isSearchFilterOn, setIsSearchFilterOn] = useState(false)
    
    //不同排序 items 、 搜尋的 items 結果 、 items 預計渲染 
    const [itemsBySort, setItemsBySort] = useState({
        "最近建立": {items:[],lastSortValue: null, hasMore: true, hasDefaultFetched : false, updateToNew: false, },
        "最快過期": {items:[],lastSortValue: null, hasMore: true, hasDefaultFetched : false, updateToNew: false, },
    })
    
    const [itemsContent, setItemsContent] = useState({
        //itmes 改為 null, 用來區分 錯誤回傳
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
            console.log('itemID to modal is ', itemId)
            setModalItemId(itemId);
            setIsModalOpen(true)
            setIsToCreate(false)
        }else{
            console.log('回傳 itmemId 資料類型不符！', typeof(itemId))
        }
    }

    const handleClickArrange = async(e)=>{
        const sortType = e.target.innerText;
        if(sortType){
            setArrangeClicked(sortType)
            handleItemsBySort(sortType)
        }else{
            console.log('sortType 沒有點擊成功',sortType)
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

    const fetchItemsBySort = async(sortType)=>{

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
                        limitNumber, itemsBySort[sortType].lastSortValue
                    )
                    break;
                default:
                    response = await  getStorageSortedItems(
                        user, storageId,  "expired_date", false,
                        limitNumber, itemsBySort[sortType].lastSortValue
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


    //切換資料排序
    const handleItemsBySort = async(sortType)=>{
        //根據 updateToNew 判斷是否需要更新資料
        if(itemsBySort[sortType].hasDefaultFetched){

            setItemsContent((prev)=>({
                ...prev,
                items: itemsBySort[sortType].items,
                hasMore: itemsBySort[sortType].hasMore,
                lastSortValue : itemsBySort[sortType].lastSortValue,
            }))
        }else{
            console.log(`排序方式 ${sortType} 首次載入資料`)
            const itemsUpdated = await fetchItemsBySort(sortType)
            if(itemsUpdated.status === "success"){
                setItemsBySort((prev)=>({
                    ...prev,
                    [sortType]:{
                        //載入sort 的第一筆資料
                        items: itemsUpdated.newItems,
                        hasDefaultFetched: true,
                        updateToNew: true,
                        hasMore: itemsUpdated.hasMore,
                        lastSortValue: itemsUpdated.lastSortValue
                    }
                }))
                setItemsContent({items: itemsUpdated.newItems, hasMore: itemsUpdated.hasMore})
            }else{ 
                alert("排序資料更新失敗")
            }
        }
    }


    //加載下一筆資料
    const getMoreData = async()=>{ 
        console.log("getMoreData triggered")
        let response ;
        if(searchShow){
            console.log('getMoreData at search is on')
            response = await fetchStorageSearchData (
                user, storageId, limitNumber, searchInfo.searchBy, "desc", 
                setSearchInfo.sortOfTime,  itemsContent.lastSortValue,
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
            
            response = await fetchItemsBySort(arrangeClicked)

            if(response.status === "success"){
                const updatedItems = [
                    ...itemsContent.items,
                    ...response.newItems
                ]
                console.log('updatedItems', updatedItems )
                if(updatedItems){
                    setItemsBySort((prevItems)=>({
                        ...prevItems,
                        [arrangeClicked]:{
                            //其他東西照常
                            ...prevItems[arrangeClicked],
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
                    console.log('文件更新錯誤')
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




    // const handleItemCreated = async(newItem, itemId)=>{
    //     if(!newItem || !itemId){
    //         console.log('itm 新增未完成, !newItem || !itemDocId', newItem  ,itemId)

    //         return;
    //     }

    //     const newItemFormated = {
    //         ...newItem,
    //         id:itemId,
    //         itemId:itemId,
    //         created_at : formateDateFromJS(newItem.created_at),
    //         expired_date: formateDateFromJS(newItem.expired_date),
    //     }

    
    //     if(!arrangeClicked){
    //         console.log("未選中項目排序")
    //         return
    //     }

    //     if(arrangeClicked === "最近建立") {
    //         setItemsContent((prevContent)=>{
    //             let newItems;
    //             const prevItems = prevContent.items || []

    //             if(prevItems.length >= limitNumber){
    //                 newItems =  [
    //                     newItemFormated,
    //                     ...prevItems.slice(0, prevItems.length - 1)
    //                 ]
    //             }else{
    //                 newItems =[newItemFormated, ...prevItems] 
    //             }
                
    //             return{
    //                 ...prevContent,
    //                 items: newItems
    //             }
    //         })

    //     }else{

    //         setItemsContent((prevContent) => {
    //             const prevItems = prevContent.items || [];
    //            // console.log('prevContent ', prevContent)
    //             let  newItems = [newItemFormated, ...prevItems];
                
    //             //若要排序要改回 js Date 型式
    //             newItems.sort((a,b)=> new Date(a.expired_date).getTime() - new Date(b.expired_date).getTime())
    //            //const updatedItems = newItems.slice(0, prevItems.length )
                
    //             return {
    //                 ...prevContent,
    //                 items: newItems.slice(0, prevItems.length),
                    
    //             }
    //         })

    //     }   


    // }
          
    const handleItemCreated = async (newItem, itemId) => {
    if (!newItem || !itemId) {
        console.log('itm 新增未完成, !newItem || !itemDocId', newItem, itemId);
        return;
    }

    const newItemFormated = {
        ...newItem,
        id: itemId,
        itemId: itemId,
        created_at: formateDateFromJS(newItem.created_at),
        expired_date: formateDateFromJS(newItem.expired_date),
    };

    if (!arrangeClicked) {
        console.log("未選中項目排序");
        return;
    }

    if (arrangeClicked === "最近建立") {
        setItemsContent((prevContent) => {
            let newItems;
            const prevItems = prevContent.items || [];

            if (prevItems.length >= limitNumber) {
                newItems = [
                    newItemFormated,
                    ...prevItems.slice(0, prevItems.length - 1),
                ];
            } else {
                newItems = [newItemFormated, ...prevItems];
            }

            return {
                ...prevContent,
                items: newItems,
            };
        });

        setItemsBySort((prevSort) => ({
            ...prevSort,
            "最近建立": {
                ...prevSort["最近建立"],
                items: [newItemFormated, ...prevSort["最近建立"].items],
                updateToNew: true, // 同步更新 updateToNew
            },
        }));
    } else {
        setItemsContent((prevContent) => {
            const prevItems = prevContent.items || [];
            let newItems = [newItemFormated, ...prevItems];

            newItems.sort(
                (a, b) =>
                    new Date(a.expired_date).getTime() -
                    new Date(b.expired_date).getTime()
            );

            return {
                ...prevContent,
                items: newItems.slice(0, prevItems.length),
            };
        });

        setItemsBySort((prevSort) => ({
            ...prevSort,
            "最快過期": {
                ...prevSort["最快過期"],
                items: [newItemFormated, ...prevSort["最快過期"].items],
                updateToNew: true, 
            },
        }));
    }
};
   
    const handleItemUpdated = (itemId, updatedItem) => {
        console.log('更新項目：', updatedItem);

        if(!arrangeClicked){
            console.log('目前沒有選中的排序方式')
            return ;
        }
        
        setItemsContent((prevContent)=>{
            let updateItems = [...prevContent.items , updatedItem];
            
            if(arrangeClicked === '最近建立'){
                updateItems.sort((a, b)=>b.created_at - a.created_at)
            }else{
                updateItems.sort((a,b)=>a.expired_date - b.expired_date)
            }

            return {
                ...prevContent,
                items: updateItems,
            }
        })
        
    
        setItemsBySort((prevSort) => {
            const currentSort = prevSort[arrangeClicked];
            if (currentSort) {
                return {
                    ...prevSort,
                    [arrangeClicked]: {
                        ...currentSort,
                        items: currentSort.items.map((item) =>
                            {
                                if(item.itemId === itemId){
                                    const newItem = {
                                        ...updatedItem,
                                        expired_date: formateDateFromJS(updatedItem.expired_date),
                                        created_at: formateDateFromJS(updatedItem.created_at),
                                    }
                                    return newItem
                                }else{
                                    const itemFormated = {
                                        ...item,
                                        expired_date: getFormatedDate(item.expired_date),
                                        created_at: getFormatedDate(item.created_at)
                                    }
                                    return itemFormated
                                }          
                            }
                        ),
                        updateToNew: true,
                    },
                };
            }
            return prevSort;
        });
    };

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
                //紀錄刪除失敗 id
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
    

        
        setItemsContent((prevItems) => {
            return {
                ...prevItems,
                items : prevItems.items.filter(item => !successfulItemIds.includes(item.id))
            }
        });

        setItemsBySort( prevItems =>{
            return {
                ...prevItems,
                "最近建立": {
                    ...prevItems["最近建立"],
                    updateToNew: false,
                },
                "最快過期": {
                    ...prevItems["最快過期"],
                    updateToNew: false,
                }

            }
        }); 
        setGroupIds(()=>{
            const remainingIds = groupIds.filter(id => !successfulItemIds.includes(id));
            return remainingIds;
        })

    }


    //搜尋
    const handleSearchItems = async () => { 
        setIsSearchFilterOn(false)

        if(searchInfo.input.trim().length < 0){
            return
        }

        const response = await fetchStorageSearchData(
            user, storageId, limitNumber, searchInfo.searchBy, "desc", searchInfo.sortOfTime, searchInfo.duration, searchInfo.input 
        ) ; 
        if(response){
            setItemsContent((prev)=>({
                ...prev,
                items:  response.data, 
                hasMore: response.hasMore,
                lastSortValue: response.sortAfter
            }))
        }
        setIsSearchFilterOn(false)
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
                setItemsBySort((prev)=>({
                    ...prev,
                    "最近建立":{
                        items: formatedData,
                        hasDefaultFetched: true,
                        updateToNew: true,
                        hasmore: response.hasMore,
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

                console.log("res from  fetched by default :", response.sortAfter, response.lastSortValue)
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
                        updateToNew: true,
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
                        {isSearchFilterOn ? (
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
                        ):null}
                    </div>
                    {searchShow ? (
                        <>
                                <div className={styles.searchInfoPanel}>
                                    搜尋結果 : 
                                    <div className={styles.infoBanner}>
                                        {searchInfo.type}
                                    </div>
                                    <div className={styles.infoBanner}>
                                        {searchInfo.sortOfTime}
                                    </div>
                                    <div className={styles.infoBanner}>
                                        {searchInfo.duration}
                                    </div>
                                    <div  className={styles.infoBanner}>
                                        <span>{searchInfo.input}</span>
                                    </div>
                                    <div 
                                        onClick={()=>{
                                            setSearchShow(false)
                                            setItemsContent((prev)=>({
                                                ...prev,
                                                items: itemsBySort[arrangeClicked].items,
                                                hasMore: itemsBySort[arrangeClicked].hasMore
                                            }))
                                        }}
                                    >
                                        <Close className={styles.closeIcon}/>
                                    </div>
                                </div>
                                <hr />
                            </>
                        ): (
                                <div className={styles.arrangePanel}>
                                    <div className={styles.arrangeBanner}>
                                        {filterOptions.map((item, index)=>(
                                            <div key={`filterBtn${ index }`}> 
                                                <div 
                                                    className={clsx(styles.arrangeBtn, {[styles.arrangeBtnClicked]:arrangeClicked === item})}
                                                    onClick={handleClickArrange}
                                                >
                                                    {item} 
                                                        
                                                </div>
                                                <span> ({itemsBySort[item].items.length})</span>
                                                <span>{itemsBySort[item].hasDefaultFetched > 0 ? 123 : 456}</span>
                                            </div > 
                                        ))}
                                    </div>
                                </div>
                        )}
                    <div className={styles.storageItemsWrapper}>
                        <div 
                            className={styles.itemsBtnPanel}
                        >
                            <input 
                                type="checkbox" 
                                onClick={selectAllItems}
                            />
                            <button
                                onClick={handleCreateItem}

                            >
                                新增項目
                            </button>
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
                                                                {item?.name}
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
                                        <div>
                                            {itemsContent.errorMsg ? ("項目讀取失敗"):("目前儲位沒有項目")}
                                        </div>
                                    )
                                )
                            }
                            <hr />
                            <div className={styles.moreDataPanel}>
                                {itemsContent.hasMore ? (
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


