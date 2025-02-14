import { useParams } from 'react-router-dom';
import styles from './StoragePage.module.scss';
import BrandHeader from '../../components/BrandHeader';
import Navbar from '../../components/Navbar';
import ItemModal from './ItemModal';
import { useEffect, useRef, useState } from 'react';
import { deleteStorageItem, fetchFilterData, getStorageDocId, getStorageItemById, removeItemDocId } from '../../config/firebase';
import {auth} from '../../config/firebase'
import { formateDateFromJS, getFormatedDate } from '../../fn';
import { 
    Delete, Search, CommentRounded, Close
    //PanoramaRounded 
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
    const [isItemsLoading, setIsItemsoading] = useState(false)
    const filterOptions =[
        "最近建立",
        "最早建立",
        "最快過期",
        "最晚過期",
    ]
    //排序 :
    const [limitNumber, setLimitNumber] = useState(10);
    const [arrangeClicked, setArrangeClicked ] = useState(filterOptions[0])
    //搜尋
    const [searchShow, setSearchShow] = useState(false)
    const [searchInput, setSearchInput] = useState("")
    const [searchInfo, setSearchInfo] = useState({
        "type": "",
        "input": ""
    })
    
    //不同排序 items 、 搜尋的 items 結果 、 items 預計渲染 
    const [itemsBySort, setItemsBySort] = useState({
        "最近建立": {items:[],lastSortValue: null, hasMore: true, updateToNew: false, },
        "最早建立": {items:[],lastSortValue: null, hasMore: true, updateToNew: false, },
        "最快過期": {items:[],lastSortValue: null, hasMore: true, updateToNew: false, },
        "最晚過期": {items:[],lastSortValue: null, hasMore: true, updateToNew: false, },
    })
    
    const [itemsContent, setItemsContent] = useState([])
    //const [itemsBySearch, setItemsBySearch] = useState([])
    
    
    //滾動位置
    const scrollContainterRef  = useRef(null);
    const lastSortValueRef = useRef(null) // 最終筆資料回傳 sortAfter


    //新增 items
    const handleCreateItem = ()=>{
        setIsModalOpen(true)
        setIsToCreate(true)
        setModalItemId("")
    } 
    

    //選取多項
    const [groupIds, setGroupIds] = useState([])


    //取得元素 item-id
    const getElementId = (e)=>{
        const itemElement = e.target.closest('[data-item-id]')
        console.log(itemElement);
        if(itemElement){
            const itemId = itemElement.dataset.itemId;
            console.log(`itemId ${itemId}`)
            return itemId
        }else{
            console.log('無具有 id 元素')
            return null
        }
    }

    //click item
    const handleClickItem = (e)=>{
        const itemId = getElementId(e)
        if(itemId){
            setModalItemId(itemId);
            setIsModalOpen(true)
            setIsToCreate(false)
        }
    }

    //search 
    const handleSearchInputChange =(e)=>{
        const input = e.target.value;
        setSearchInput(input)
    }

    
    const handleClickArrange = async(e)=>{
        const sortType = e.target.innerText;
        if(sortType){
            setArrangeClicked(sortType)
            handleItemsBySort(sortType)
        }else{
            console.log('sortType 沒有點擊成功'. sortType)
        }
        
    }

    //get items(arranged) 
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


    const fetchitemsBySort = async(sortType)=>{

        let items = []
        let hasMoreData = false

        let lastSortValue = itemsBySort[sortType]?.lastSortValue || null
        setIsItemsoading(true)
        try {

            let response ;

            switch (sortType) {
                case "最近建立":
                     response = await  fetchFilterData(user, storageId, limitNumber, "created_at", true, itemsBySort[sortType].lastSortValue)
                    break;
                case "最早建立":
                    response = await  fetchFilterData(user, storageId, limitNumber, "created_at", false, itemsBySort[sortType].lastSortValue)
                    break;
                case "最快過期":
                    response = await  fetchFilterData(user, storageId, limitNumber, "expired_date", false, itemsBySort[sortType].lastSortValue)
                    break;
                default:
                    response = await  fetchFilterData(user, storageId, limitNumber, "expired_date", true, itemsBySort[sortType].lastSortValue)
                    break;
            }

            setIsItemsoading(false)
            if(response){
                items = response.data || [] ; 
                hasMoreData = response.hasMore ;
                lastSortValue = response.sortAfter ; 
            }
            const formateditems = getformatedItems(items)
            return {
                status: "success",
                newItems: formateditems,
                hasMore : hasMoreData,
                lastSortValue : lastSortValue,

            }
        } catch (error) {
            console.error("failed to fetch items by sort",error)
            setIsItemsoading(false)
            return {
                status: "falied",
                newItems: null
            }
        }
    }

    //不同 sortby fetch 函式
    const handleItemsBySort =async(sortType)=>{
        console.log('handleItemsBySort trigered by sortType:', sortType)
        if(itemsBySort[sortType].updateToNew){
           console.log(`現有資料沿用自：${sortType}`,
            //itemsBySort[sortType].items
            )
            setItemsContent(itemsBySort[sortType].items)
        }else{
            const itemsUpdated = await fetchitemsBySort(sortType)
            if(itemsUpdated.status === "success"){
                setItemsBySort((prev)=>({
                    ...prev,
                    [sortType]:{
                        items: itemsUpdated.newItems,
                        updateToNew: true,
                        hasMore: itemsUpdated.hasMore,
                        lastSortValue: itemsUpdated.lastSortValue
                    }
                }))
                setItemsContent(itemsUpdated.newItems)
            }else{ 
                alert("排序資料更新失敗")
            }
        }
    }

    //滾動載入更多資料

    const handelScroll = ()=>{
        //TODO: 根據監聽， 滾動位置
        //取出位置
        const container = scrollContainterRef.current;

        //過濾終止檢查 : 若引入 search 完成，改為 itemContent.hasMore，一起把 jsx 改一下
        if (!container || isItemsLoading || !itemsBySort[arrangeClicked].hasMore){
            return;
        }
        //滾動高度 （這邊用到 scrollTop） vs ref 高度

    }

    //載入當前(排序)下一筆資料, 呼叫對應 sortType 的  lastValue 
    const getMoreData = ()=>{

    }

    //監聽子元件觸發 item CRUD：

    //CRUD 成功則觸發：
    const handleItemChanged = async()=>{
        console.log('資料更新!，重置 資料更新檢查 false')
        setItemsBySort((prevItems)=>{
            const itemsReseted = Object.keys(itemsBySort).reduce((acc, key)=>{
                acc[key] = {
                    ...prevItems[key],
                    updateToNew: false,
                }
                return acc
            },{})
            return itemsReseted;
        })
        await fetchitemsBySort()
    }

    const handleItemCreated = async(newItem, itemDocId)=>{
        if(!newItem || !itemDocId){
            console.log('item 新增未完成, !newItem || !itemDocId', newItem  ,itemDocId)
            return;
        }
        await handleItemChanged()
    }

    const handleItemUpdated = async(itemId)=>{
        if(!itemId){
            console.log('無對應 itemID')
        }
        await handleItemChanged()
    }
    
    const handleDeleteItem =async (e) => {
        e.stopPropagation();
        const itemElement = e.target.closest('[data-item-id]')
        if(!itemElement){
            console.log('無元素具有對應 id')
            return;
        }

        if(itemElement){
            const itemId = itemElement.dataset.itemId;
            const result = await deleteStorageItem(user, storageName, itemId)
            if(result === "success"){
                await handleItemChanged()
            }else{
                Swal.fire({
                    text:"項目移除失敗",
                    icon:"error"
                })
            }
        }
    }

    //搜尋
    const handleSearchItems = async () => { 
        if(!searchInput){
            console.log('無搜尋內容傳入')
            return
        }
        //TODO : 依照使用者要求 呼叫後端 api 向 資料庫搜尋回傳值
        console.log(`依照需求向後端要求 name 為 ${searchInput} items`)

        //取得 itemsBySearch <-這個可以取消掉誒

        //確定有完成，將 itemsContent 設為
    }

    //切換顯示 itemsBysortType || itmesBySearch

    // const getContentItems = ()=>{

    //     //應該各自設置會比較好，點擊設置  取消設置回去，就不會有第一次。

    //     if(!searchShow){
    //         //setItemsContent(itemsBySort[arrangeClicked].items)
    //         console.log(`未執行搜尋,`)
    //     }else{
    //         console.log('顯示搜尋結果：')

            
    //         setItemsContent(itemsBySearch)
    //     }
    // }


    //fetchItemsByDefault：首次頁面渲染用
    const fetchItemsByDefault = async()=>{
        setIsItemsoading(true)
        if(storageName){
            const response = await fetchFilterData(user, storageId, limitNumber, "created_at", true);
            if(response && response.length){
                const formatedData = await getformatedItems(response.data);
                setItemsBySort((prev)=>({
                    ...prev,
                    "最近建立":{
                        items: formatedData,
                        updateToNew: true,
                        hasmore: response.hasMore,
                        lastSortValue : response.sortAfter,
                    }
                }))
                setItemsContent(formatedData)
                setIsItemsoading(false)
                console.log('fetchItemsByDefault trigger!')
            }else{
                setItemsBySort((prev)=>({
                    ...prev,
                    "最近建立":{
                        items: [],
                        updateToNew: true,
                    }
                }))
                setItemsContent([])
                setIsItemsoading(false)
            }
        }else{
            console.log(`StorageCard ${storageName} 無正確傳入`,storageName)
            setIsItemsoading(false)
        } 
    }

    //勾選:刪除
    const handleItemSelected = (e)=>{
        const itemId = getElementId(e);
        //checked 就加入；反之移除
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


    const handleDelteGroupItem = async()=>{
        if(!groupIds || groupIds.length === 0){
            console.log("無選中任何項目")
            return
        }
        const resultArr = await Promise.all(
            groupIds.map(async(itemId)=>{
                return await deleteStorageItem(user, storageName, itemId)
            })
        )
        const isItemFailed = resultArr.find(item => item !== "success")
        if(!isItemFailed){
            await handleItemChanged()
            console.log('勾選項目刪除成功')
        }else{
            console.log('勾選項目刪除失敗')
        }
    }

    
    
    //頁面首次渲染:預設排序
    useEffect(()=>{
        fetchItemsByDefault();
    },[storageName])



    //監聽滾輪觸發
    useEffect(()=>{
        
    },[])

//     //搜尋功能
//    useEffect(()=>{
//         getContentItems()
//         console.log('sortType:', arrangeClicked)
//    },[setSearchShow])


//    //監聽一下：
    //    const allItems = Object.values(itemsBySort).map((item)=>(item.updateToNew))
    //    useEffect(()=>{
    //     console.log("allUpdateToNew",allItems)
    //    },[itemsBySort])


    //    useEffect(()=>{
    //     console.log(`目前 sortType:${arrangeClicked}`, 
    //         'items',itemsBySort[arrangeClicked].items,
    //         'lastSortValue',itemsBySort[arrangeClicked].lastSortValue, 
    //         'updateToNew',itemsBySort[arrangeClicked].updateToNew )
    //    },[arrangeClicked])

    //監聽 items
    //    useEffect(()=>{
    //     console.log('監聽itemsContent', itemsContent)
    //    },[itemsContent])

    //    useEffect(()=>{
    //     console.log('監聽 storageItems', storageItems)
    //    },[storageItems])
    
    //    useEffect(()=>{
    //     console.log('監聽 arrangeItems', arrangeItems)
    //    },[arrangeItems])

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
                    <div className={styles.searchPanel}>
                        <input 
                            type="text" 
                            className="text" 
                            placeholder='輸入搜尋名稱'
                            onChange={handleSearchInputChange}
                        />
                        <div 
                            className={styles.iconContainer}
                            onClick={handleSearchItems}
                        >
                            <Search className={styles.searchIcon}/>
                        </div>
                    </div>
                    {searchShow ? (
                        <>
                                <div className={styles.searchInfoPanel}>
                                    搜尋結果 : 
                                    <div className={styles.searchBytype}>
                                        {searchInfo.type}
                                    </div>
                                    <div  className={styles.searchByInput}>
                                        <span>{searchInfo.input}</span>
                                    </div>
                                    
                                    <div 
                                        onClick={()=>{
                                            setSearchShow(false)
                                            setItemsContent(itemsBySort[arrangeClicked].items)
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
                                                    //key={`filterBtn${ index }`}
                                                >
                                                    {item} 
                                                </div>
                                            </div > 
                                        ))}
                                    </div>
                                </div>
                        )}
                    <div 
                        className={styles.storageItemsWrapper}
                        ref={scrollContainterRef}
                        onScroll={handelScroll}
                    >
                        <table className={styles.storageItemsPanel}>
                            <thead>
                                <tr className={styles.itemTitleWrapper}>
                                    <th className={styles.selectItem}>
                                        <input 
                                            type="checkbox" 
                                        />
                                    </th>
                                    <th className={styles.itemTitle}>名稱</th>
                                    <th className={styles.itemTitle}>數量</th>
                                    <th className={styles.itemTitle}>單位</th>
                                    <th className={styles.itemTitle}>到期日期</th>
                                    <th className={styles.itemTitle}>建立日期</th>
                                    <th className={styles.delteItem}>刪除項目</th>
                                    <th className={styles.itemhasNote}>項目備註</th>
                                    {/* <th className={styles.itemhasPicture}>項目圖片</th> */}
                                </tr>
                            </thead>
                            <tbody>
                                {isItemsLoading? (
                                    <>
                                        <tr>
                                            <td>資料取得中...</td>
                                        </tr>
                                    </>
                                ):(
                                    itemsContent && itemsContent.length ? (
                                        itemsContent.map((item)=>{
                                            return(
                                                <tr 
                                                    data-item-id={item.id}
                                                    className={styles.itemContainer} 
                                                    key={item.id}
                                                    onClick={handleClickItem}
                                                >
                                                    <td  className={styles.itemCheckbox} >
                                                        <input 
                                                            onClick={handleItemSelected}
                                                            type="checkbox" 
                                                            className={styles.checkBocIcon}
                                                        />
                                                    </td>
                                                    <td className={styles.storageItem} >{item?.name}</td>
                                                    <td className={styles.storageItem} >{item?.amount}</td>
                                                    <td className={styles.storageItem} >{item?.unit}</td>
                                                    <td className={styles.storageItem} >{item?.expired_date}</td>
                                                    <td className={styles.storageItem} >{item?.created_at}</td>
                                                    <td className={styles.itemDelteIcon}
                                                        onClick={handleDeleteItem}
                                                    >
                                                        <Delete className={styles.delteIcon}/>
                                                    </td>
                                                    <td
                                                        className={styles.itemOpenNotesIcon}
                                                    >{item.notes ? (
                                                            <CommentRounded className={styles.notesIcon}/>
                                                        ):(
                                                            null
                                                        )}
                                                    </td>
                                                    {/* <td
                                                        className={styles.itemOpenPictureIcon}
                                                    >{item.hasPicture ? (
                                                            <PanoramaRounded className={styles.pictureIcon}/>
                                                        ):(
                                                            null
                                                        )}
                                                    </td> */}
                                                </tr>
                                            )
                                        })
                                    ):(
                                        <tr  
                                            className={styles.noItemsContainer} 

                                        >
                                            <td colSpan="8" className={styles.noStorageItems}>
                                                <span>{searchShow? "無符合搜尋內容項目" : "儲位尚無庫存"}</span>
                                                <button 
                                                    onClick={handleCreateItem}>
                                                    新增儲位項目
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                        {itemsContent && itemsContent.length ? (
                            <div className={styles.createItemPanel}>
                                <button
                                    onClick={handleCreateItem}
                                >
                                    新增儲位項目
                                </button>
                            </div>
                            ) : null
                        }
                        {groupIds && groupIds.length ? (
                            <div className={styles.groupItemPanel}>
                                <button
                                    onClick={handleDelteGroupItem}
                                >
                                    刪除勾選項目
                                </button>
                            </div>
                        ):null}

                    </div>
                    {searchShow ? (null) : (
                       itemsBySort[arrangeClicked].hasMore ? (
                        <>
                            <span>向下滾動載入更多</span>
                        </>
                       ): (
                        <>
                            <span>無更多項目</span>
                        </>
                       ) 
                    )}
                </div>
                    {isModalOpen && (
                        <>
                            <div className={styles.modalMask}></div>
                            <ItemModal
                                isToCreate={isToCreate}
                                setIsModalOpen={setIsModalOpen}
                                modalItemId={modalItemId}
                                storageName={storageName}
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


