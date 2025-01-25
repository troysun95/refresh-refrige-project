import { useParams } from 'react-router-dom';
import styles from './StoragePage.module.scss';
import BrandHeader from '../../components/BrandHeader';
import Navbar from '../../components/Navbar';
import ItemModal from './ItemModal';
import { useEffect, useState } from 'react';
import { deleteStorageItem, getStorageItemById, getStorageItems } from '../../config/firebase';
import {auth} from '../../config/firebase'
import { formateDateFromJS, getFormatedDate } from '../../fn';
import { 
    Delete, Search, CommentRounded, 
    //PanoramaRounded 
} from '@mui/icons-material';
import clsx from 'clsx';
import Swal from 'sweetalert2';
const StoragePage = ()=>{
    const user = auth.currentUser;
    const {storageName} = useParams();
    const [storageItems, setStorageItems] = useState([])
    //modal
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
    const [filterClicked, setFilterClicked ] = useState(filterOptions[0])
    const handleCreateItem = ()=>{
        setIsModalOpen(true)
        setIsToCreate(true)
        setModalItemId("")
    }
    const handleClickItem = (e)=>{
        const itemElement = e.target.closest('[data-item-id]')
        console.log(itemElement);
        if(itemElement){
            const itemId = itemElement.dataset.itemId;
            console.log(`itemId ${itemId}`)
            setModalItemId(itemId);
            setIsModalOpen(true)
            setIsToCreate(false)
        }else{
            console.log('無具有 id 元素')
        }
    }


    const handleSearchItems = async () => { 
        
    }

    //filter

    const handleClickFilter =async(e)=>{
        const filterType = e.target.innerText;
        setFilterClicked(filterType)
        
    }


    const arrangeItemsByFilter= async(filterClicked)=>{
        console.log("arrangeItemsByFilter trigger:",filterClicked)
        setIsItemsoading(true)
        let newItems = []
        if(filterClicked === filterOptions[0]){
            newItems = arrangeItemsByLatest(storageItems, "created_at" )
        }else if(filterClicked === filterOptions[1]){
            newItems = arrangeItemsByEarly(storageItems, "created_at" )
        }else if(filterClicked === filterOptions[2]){
            newItems = arrangeItemsByEarly(storageItems, "expired_date" )
        }else{
            newItems = arrangeItemsByLatest(storageItems, "expired_date" )
            
        }
        setStorageItems(newItems)
        setIsItemsoading(false)
    }

    const arrangeItemsByEarly = (items, keyName)=>{
        //用淺拷貝避免修改掉..
        const compareByCreatedEarly =(a, b)=>{
            console.log('比較by',keyName)
            const dateA = new Date(a[keyName]);
            const dateB = new Date(b[keyName]);
            if(dateA > dateB){
                return 1;
            }
            if(dateA < dateB){
                return - 1 ;
            }
            return 0
        }
        const sortedData = [...items].sort(compareByCreatedEarly)
        return sortedData;
    }

    const arrangeItemsByLatest = (items, keyName)=>{
        //用淺拷貝避免修改掉..
        const compareByCreatedEarly =(a, b)=>{
            const dateA = new Date(a[keyName]);
            const dateB = new Date(b[keyName]);

            if(dateA > dateB){
                return - 1;
            }
            if(dateA < dateB){
                return  1 ;
            }
            return 0
        }
        const sortedData = [...items].sort(compareByCreatedEarly)
        return sortedData;
    }

    
    const handleItemSelected =(e)=>{
        e.stopPropagation();
    }


    //監聽子元件觸發

    const handleItemCreated = async(newItem, itemDocId)=>{

        if(!newItem){
            console.log('呼叫 itemData 失敗')
        }else{
            console.log('callback newItem:',newItem)
        }

        const formatedData = {
            ...newItem,
            expired_date: formateDateFromJS(newItem.expired_date),
            created_at: formateDateFromJS(newItem.created_at),
            id:itemDocId
        }
        storageItems.push(formatedData)
        await arrangeItemsByFilter()
    }

    const handleItemUpdated = async(itemId)=>{
        console.log('handleItemUpdated triggered')
        const updatedItem = await getStorageItemById(user, storageName, itemId)
        if(updatedItem){
            const formatedItem = {
                ...updatedItem,
                expired_date: getFormatedDate(updatedItem.expired_date),
                created_at: getFormatedDate(updatedItem.created_at)
            }
            const newStorageItems = storageItems.map((item)=>{
                if(item.id === itemId){
                    return formatedItem
                }else{
                    return item
                }
            })
            setStorageItems(newStorageItems)
        }
    }
    
    const handleDeleteItem =async (e) => {
        e.stopPropagation();
        const itemElement = e.target.closest('[data-item-id]')
        if(!itemElement){
            console.log('無元素具有對應 id')
            return
        }

        if(itemElement){
            const itemId = itemElement.dataset.itemId;
            const result = await deleteStorageItem(user, storageName, itemId)

            if(result){
                const newStorageItems = storageItems.filter(item => item.id !== itemId )
                setStorageItems(newStorageItems)
            }else{
                Swal.fire({
                    text:"項目移除失敗",
                    icon:"error"
                })
            }
        }
    }
    


    const fetchStorgeItems = async()=>{
        setIsItemsoading(true)
        if(storageName){
            const dataArr = await getStorageItems(user, storageName)
            if(dataArr && dataArr.length){
                const formatedData = dataArr.map((item)=>{
                    const formateditem = {
                        ...item,
                        created_at: getFormatedDate(item.created_at),
                        expired_date : getFormatedDate(item.expired_date),
                    }
                    return formateditem
                })
                setStorageItems(formatedData)
                setIsItemsoading(false)
            }else{
                setStorageItems([])
                setIsItemsoading(false)
            }
        }else{
            console.log(`StorageCard ${storageName} 尚未傳入`)
            setIsItemsoading(false)
        } 
    }


    useEffect(()=>{
        fetchStorgeItems();
    },[storageName])
    
    
    useEffect(()=>{
        arrangeItemsByFilter(filterClicked)
    },[filterClicked])

    return(
        <>
            <div className={styles.storagePage}>
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
                        />
                        <div 
                            className={styles.iconContainer}
                            onClick={handleSearchItems}
                        >
                            <Search className={styles.searchIcon}/>
                        </div>
                    </div>
                    <div className={styles.filterPanel}>
                        <div className={styles.filterBanner}>
                            {filterOptions.map((item, index)=>(
                                <>
                                    <div 
                                        className={clsx(styles.filterBtn, {[styles.filterBtnClicked]:filterClicked === item})}
                                        onClick={handleClickFilter}
                                        key={`filterBtn-${index + 1}`}
                                    >
                                        {item} 
                                    </div>
                                </>
                            ))}
                        </div>
                    </div>
                    <div className={styles.storageItemsWrapper}>
                        <table className={styles.storageItemsPanel}>
                            <thead>
                                <tr className={styles.itemTitleWrapper}>
                                    <th className={styles.selectItem}>
                                        <input type="checkbox" />
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
                                    storageItems && storageItems.length ? (
                                        storageItems.map((item)=>{
                                            return(
                                                <tr 
                                                    data-item-id={item.id}
                                                    className={styles.itemContainer} 
                                                    key={item?.id}
                                                    onClick={handleClickItem}
                                                >
                                                    <td  className={styles.itemCheckbox} >
                                                        <input 
                                                            onClick={handleItemSelected}
                                                            type="checkbox" 
                                                        />
                                                    </td>
                                                    <td className={styles.storageItem}>{item?.name}</td>
                                                    <td className={styles.storageItem}>{item?.amount}</td>
                                                    <td className={styles.storageItem}>{item?.unit}</td>
                                                    <td className={styles.storageItem}>{item?.expired_date}</td>
                                                    <td className={styles.storageItem}>{item?.created_at}</td>
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
                                        <tr  className={styles.noItemsContainer} >
                                            <td colSpan="8" className={styles.noStorageItems}>
                                                <span>儲位尚無庫存</span>
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
                    </div>
                    {storageItems && storageItems.length ? (
                        <div className={styles.createItemPanel}>
                            <button
                                onClick={handleCreateItem}
                            >
                                新增儲位項目
                            </button>
                        </div>
                    ) : null
                    }
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


