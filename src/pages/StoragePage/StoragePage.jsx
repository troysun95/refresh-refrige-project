import { useParams } from 'react-router-dom';
import styles from './StoragePage.module.scss';
import BrandHeader from '../../components/BrandHeader';
import Navbar from '../../components/Navbar';
import ItemModal from './ItemModal';
import { useEffect, useState } from 'react';
import { deleteStorageItem, getStorageItemById, getStorageItems } from '../../config/firebase';
import {auth} from '../../config/firebase'
import { getFormatedDate } from '../../fn';
import { Delete, Search } from '@mui/icons-material';
const StoragePage = ()=>{
    const user = auth.currentUser;
    const {storageName} = useParams();
    const [storageItems, setStorageItems] = useState([])
    //modal
    const [isToCreate, setIsToCreate] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalItemId, setModalItemId] = useState();
    const handleCreateItem = ()=>{
        setIsModalOpen(true)
        setIsToCreate(true)
    }

    const handleClickItem = (e)=>{
        //不改最近的，改去 parent element
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

    const handleItemSelected =(e)=>{
        e.stopPropagation();
    }
    //監聽子元件觸發

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
            //移除對應 storageName
            if(result){
                const newStorageItems = storageItems.filter(item => item.id !== itemId )
                setStorageItems(newStorageItems)
            }else{
                console.log("移除項目失敗")
            }
            
        }
    }
    
    const fetchStorgeItems = async()=>{
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
            }else{
            setStorageItems([])
            }
        }else{
            console.log(`StorageCard ${storageName} 尚未傳入`)
        } 
    }


    useEffect(()=>{
        fetchStorgeItems();
    },[storageName])
    
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
                            <div className={styles.filterBtn}>預設</div>
                            <div className={styles.filterBtn}>最早</div>
                            <div className={styles.filterBtn}>最晚</div>
                        </div>
                        <div className="dropDownMenu">
                            
                        </div>
                    </div>
                    <div className={styles.storageItemsWrapper}>
                        <table className={styles.storageItemsPanel}>
                            <thead>
                                <tr className={styles.itemTitleWrapper}>
                                    {storageItems && storageItems.length ?(
                                        <th className={styles.selectItem}>選取項目</th>
                                    ):null}
                                    <th className={styles.itemTitle}>名稱</th>
                                    <th className={styles.itemTitle}>數量</th>
                                    <th className={styles.itemTitle}>單位</th>
                                    <th className={styles.itemTitle}>到期日期</th>
                                    <th className={styles.itemTitle}>建立日期</th>
                                    {storageItems && storageItems.length ?(
                                        <th className={styles.delteItem}>刪除項目</th>
                                    ):null}
                                    
                                </tr>
                            </thead>
                            <tbody>
                                {storageItems && storageItems.length ? (
                                    storageItems.map((item)=>{
                                        return(
                                            <tr 
                                                data-item-id={item.id}
                                                className={styles.itemContainer} 
                                                key={item?.id}
                                                onClick={handleClickItem}
                                            >
                                                <td   className={styles.itemCheckbox}
                                                
                                                >
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
                                            </tr>
                                        )
                                    })
                                ):(
                                    <tr  className={styles.itemContainer} >
                                        <td colSpan="5" className={styles.noStorageItems}>
                                            <span>儲位尚無庫存</span>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                </div>
                <div>
                    <h3>測試用區域</h3>
                    <button
                        onClick={handleCreateItem}
                    >新增儲位項目</button>
                    {isModalOpen && (
                        <ItemModal
                            isToCreate={isToCreate}
                            setIsModalOpen={setIsModalOpen}
                            modalItemId={modalItemId}
                            storageName={storageName}
                            onItemUpdated={handleItemUpdated}
                        />
                    )}
                    
                </div>
                
            </div>
        </>
    )
}

export default StoragePage;