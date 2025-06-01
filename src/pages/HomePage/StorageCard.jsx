
import styles from './HomePage.module.scss'
import { useState, useEffect, useRef } from "react";
import {  updateStorageTitle, deleteStorage, getStorageSortedItems} from '../../config/firebase';
import { getFormatedDate } from '../../fn';
import { useNavigatePage } from '../../contexts/NavigatePageContext';
import {Delete, ModeRounded, CommentRounded, Photo } from "@mui/icons-material";
import Swal from 'sweetalert2';

const ModifyCardModal = ({
    user, 
    storageTitle, 
    setIsModifyModalOpen, 
    id,
    onStorageChanged,
    isToDelete,
 })=>{
    const [nameInput, setNameInput] = useState(storageTitle)

    const handleNameInputChange =(e)=>{
        const name = e.target.value;
        setNameInput(name)
    }



    const handleUpdateStorage = async()=>{
        const result = await updateStorageTitle(user, id, nameInput)
        if(result === "success"){
            onStorageChanged(id, nameInput)
            setIsModifyModalOpen(false)
            Swal.fire({
                title:"修改成功",
                icon:"success"
            })
        }else{
            Swal.fire({
                title:"修改失敗",
                icon:"error"
            })
        }
    }


    const handleDeleteStorage = async () => {
        if(!id){
            Swal.fire({
                title: "無法刪除儲位！",
                text: "尚未取得儲位 id",
                icon:"error"
            })
            setIsModifyModalOpen(false)
            return 
        }
        const result = await deleteStorage(user, id)
        if(result === "success"){
            Swal.fire({
                title: "儲位刪除成功",
                icon:"success"
            })
            onStorageChanged(id, storageTitle)
        }else{
            Swal.fire({
                title: "儲位刪除失敗",
                icon:"error"
            })
        }
    
    }

    return(
        <>
            <div className={styles.modifyCardModal}>
                {isToDelete ? (
                    <>
                        <h3>確定刪除儲位 {storageTitle}  ? </h3>
                        <div className={styles.btnPanel}>
                            <button 
                                onClick={()=>{setIsModifyModalOpen(false)}}
                                className={styles.cancelBtn}
                            >
                                取消
                            </button>
                            <button 
                                className={styles.deleteBtn}
                                onClick={handleDeleteStorage}
                            >確定</button>
                        </div>
                    </>
                ):(
                    <>
                        <h3>修改儲位名稱</h3>
                        <input 
                            type="text" 
                            defaultValue={storageTitle}
                            onChange={handleNameInputChange} 
                        />
                        <div className={styles.btnPanel}>
                            <button 
                                
                                onClick={()=>{setIsModifyModalOpen(false)}}
                                className={styles.cancelBtn}
                            >
                                取消
                            </button>
                            {nameInput.trim().length ? (
                                <button
                                    className={styles.modifyBtn}
                                    data-item-id={id}
                                    onClick={handleUpdateStorage}
                                >
                                    修改
                                </button>
                                ):(
                                    <button style={{fontSize: "18px", color:"red", cursor:"not-allowed"}}>
                                        名稱不可為空白
                                    </button>
                                )
                            }
                            
                        </div>
                    </>
                )}
            </div>
        </>
    )
}

const StorageCard = ({
    storageTitle,
    user, 
    id ,
    onStorageChanged,
})=>{
    const {handelToStoragePage} = useNavigatePage()
    const [previewItems, setPreviewItems] = useState([])
    const [isToDelete, setIsToDelete] = useState(false)
    const [isModifyModalOpen, setIsModifyModalOpen] = useState(false)
    const [isPreveiwLoading, setIsPreveiwLoading] = useState(false)
    const [dataFetched, setDataFetched] = useState(false)

    const previewItemInitailize = useRef(false)

    const fetchStoragePreviewData = async()=>{
        if(storageTitle){
            setIsPreveiwLoading(true)
            const response = await getStorageSortedItems(user, id, "created_at", true, 5)
            if(response.status === "failed"){
                setDataFetched(false)
            }else{
                if(response.data.length > 0){
                    const formatedData = response.data.map((item)=>{
                        const formateItem = {
                            ...item,
                            expired_date: getFormatedDate(item.expired_date),
                            created_at: getFormatedDate(item.created_at),
                        }
                        return formateItem
                    })

                    setPreviewItems(formatedData)

                }else{
                    setPreviewItems([])
                }
                setDataFetched(true)
            }
            setIsPreveiwLoading(false)
        }else{
            console.log(`StorageCard ${storageTitle} 尚未傳入`)
        } 
    }

    

    useEffect(()=>{
        if(storageTitle && !previewItemInitailize.current ){
            fetchStoragePreviewData()
            previewItemInitailize.current = true
            console.log(`儲位 ${storageTitle} items`, previewItems)
        }
    },[storageTitle, previewItems.length])



    return (
        <div
            className={styles.storageCardContainer}
        >
            <div className={styles.cardTitlePanel}>
                <div
                    className={styles.cardTitle}
                    onClick={handelToStoragePage}
                    data-item-id={id}
                >
                    {storageTitle}
                </div>
            </div>
            <div className={styles.itemCardsPanel}>
                {/* 這邊用 map 渲染 */}
                {isPreveiwLoading ? (
                    <div>
                        資料載入中...
                    </div>
                ):(
                    previewItems && previewItems.length ? (
                        previewItems.map((item)=>{
                            return(
                                <div className={styles.itemCard} key={item?.itemId}>
                                    <div className={styles.cardInfo}>
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
                        <div  className={styles.previewItems} >
                            <div  className={styles.noStorageItems}>
                                <span>{dataFetched ? "儲位尚無庫存":"預覽載入失敗，請稍後再試"}</span>
                            </div>
                        </div>             
                    )
                )}
            </div>
            <div className={styles.fastCreatePanel}>
               
                <hr />
                <div 
                    className={styles.toModifyCardPanel}
                >
                    <div 
                        className={styles.iconPanel}
                        onClick={()=>{
                            setIsModifyModalOpen(true)
                            setIsToDelete(false)
                        }}
                        data-id={id}
                    >
                        <ModeRounded/>
                        <span className={styles.modifyStorageName} >修改儲位名稱</span>
                    </div>
                    <div className={styles.iconPanel}
                        data-id={id}
                        onClick={()=>{
                            setIsModifyModalOpen(true)
                            setIsToDelete(true)
                        }}
                    >
                        <Delete/>
                        <span  
                            className={styles.delteStorage}
                        >刪除儲位</span>
                    </div>
                </div>
            </div>
            {isModifyModalOpen ? (
            <ModifyCardModal
                user= {user}
                id={id}
                storageTitle={storageTitle}
                setIsModifyModalOpen={setIsModifyModalOpen}
                onStorageChanged={onStorageChanged}
                isToDelete={isToDelete}
            />): null
            }
        </div>
    )
}

export default StorageCard;