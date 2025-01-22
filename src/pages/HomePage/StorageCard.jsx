
import styles from './HomePage.module.scss'
import { useState, useEffect, useRef } from "react";
import { getStorageItems, createStorageItem, updateStorage, deleteStorage} from '../../config/firebase';
import { getFormatedDate } from '../../fn';
import { useNavigatePage } from '../../contexts/NavigatePageContext';
import Swal from 'sweetalert2';
import {Delete, ModeRounded} from "@mui/icons-material"

const ModifyCardModal = ({
    user, 
    storageName, 
    setIsModifyModalOpen, 
    id,
    onStorageNameUpdated,
 })=>{
    //頁面滾動禁止 ＋ 黑底背景
    const [nameInput, setNameInput] = useState(storageName)
    const handleNameInputChange =(e)=>{
        const name = e.target.value;
        setNameInput(name)
    }

    const handleUpdateStorage = async()=>{
        const result = await updateStorage(user, id, storageName, nameInput)
        if(result === "success"){
            console.log("更新成功 確認 storageCard")
            onStorageNameUpdated(id, nameInput)
            setIsModifyModalOpen(false)
        }
    }


    return(
        <>
            <div className={styles.modifyCardModal}>
                <h3>修改儲位名稱</h3>
                <input 
                    type="text" 
                    defaultValue={storageName}
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
                            data-item-id={id}
                            onClick={handleUpdateStorage}
                        >
                            修改
                        </button>
                        ):null
                    }
                </div>
            </div>
        </>
    )
}

const StorageCard = ({
    storageName,
    user, 
    onItemCreated, 
    id ,
    onStorageNameUpdated,
    onStorageDeleted,
})=>{
    const {handelToStoragePage} = useNavigatePage()
    const [previewItems, setPreviewItems] = useState([])
    const [storageItem, setStorageItem ]= useState({
        name:"",
        amount: "",
        unit: "",
        expired_date: "",
    })
    const [allInputValid, setAllInputValid]= useState(false)
    const [isModifyModalOpen, setIsModifyModalOpen] = useState(false)
    const previewItemInitailize = useRef(false)
    //storage preview data
    const fetchStoragePreviewData = async()=>{
        if(storageName){
            const dataArr = await getStorageItems(user, storageName, 5)
            if(dataArr && dataArr.length){
                const formatesData = dataArr.map((item)=>{
                    const formateditem = {
                        ...item,
                        created_at: getFormatedDate(item.created_at),
                        expired_date : getFormatedDate(item.expired_date),
                    }
                    return formateditem
                })
                setPreviewItems(formatesData)
            }else{
                console.log(`${storageName} preview datas:`,dataArr)
            }
        }else{
            console.log(`StorageCard ${storageName} 尚未傳入`)
        } 
    }
    
    //sotarge item create
    const handleItemInputChange =(e)=>{
        const {name, value }= e.target;
        setStorageItem((prev)=>({
            ...prev,
            [name]: value
        }))
        
    }

    const handleCreateStorageItem = async(e)=>{
        e.preventDefault();
        const jsCreateDate = new Date()
        const jsExpiredDate = new Date(storageItem.expired_date)
        const newItem = {
            name: storageItem.name,
            amount : storageItem.amount,
            unit : storageItem.unit,
            expired_date: jsExpiredDate,
            created_at: jsCreateDate,
        }  
        if(!allInputValid){
            alert('建立項目欄位不可為空白')
            return
        }
        const result = await createStorageItem(user, storageName, newItem);

        if(result === "success"){
            Swal.fire({
                text:"快速建立項目成功",
                icon: 'success'
            })
        }else{
            Swal.fire({
                text:"快速建立項目失敗",
                icon: 'error'
            })
        }

        if (onItemCreated && (jsExpiredDate <= jsCreateDate)) {
            onItemCreated(storageName);
        }
        
        await fetchStoragePreviewData()
        setStorageItem({
            name:"",
            amount: "",
            unit: "",
            expired_date: "",
        })
    }

    const checkInputValid =(storageItem)=>{
        const isAllValid =  Object.values(storageItem).every((value) => value);
        setAllInputValid(isAllValid)
    }


    //storage delete
    const handleDeleteStorage = async (e) => {
        const elementWithId = e.target.closest('[data-id]')
        if(!elementWithId){
            throw new Error('無法刪除儲位因為缺少對應 id')
        }else{
            const storageDocId = elementWithId.dataset.id;
            const result = await deleteStorage(user, storageDocId)
            if(result === "success"){
                onStorageDeleted(storageName)
            }else{
                console.log('尚未成功刪除儲位')
            }
        }
    }

    useEffect(()=>{
        if(storageName && !previewItemInitailize.current ){
            fetchStoragePreviewData()
            previewItemInitailize.current = true
        }
        if(storageItem){
            checkInputValid(storageItem);
        }
    },[storageName, previewItems.length, storageItem])

    return (
        <div
            className={styles.storageCardContainer}
        >
            <div className={styles.cardTitlePanel}>
                <div
                    className={styles.cardTitle}
                    onClick={handelToStoragePage}
                >
                    {storageName}
                </div>
            </div>
            <table className={styles.previewItemsPanel}>
                <thead>
                    <tr className={styles.itemTitleWrapper}>
                        <th className={styles.itemTitle}>名稱</th>
                        <th className={styles.itemTitle}>數量</th>
                        <th className={styles.itemTitle}>單位</th>
                        <th className={styles.itemTitle}>到期日期</th>
                        <th className={styles.itemTitle}>建立日期</th>
                    </tr>
                </thead>
                <tbody>
                    {previewItems && previewItems.length ? (
                        previewItems.map((item)=>{
                            return(
                                <tr className={styles.previewItems} key={item?.id}>
                                    <td className={styles.previewItem}>{item?.name}</td>
                                    <td className={styles.previewItem}>{item?.amount}</td>
                                    <td className={styles.previewItem}>{item?.unit}</td>
                                    <td className={styles.previewItem}>{item?.expired_date}</td>
                                    <td className={styles.previewItem}>{item?.created_at}</td>
                                </tr>
                            )
                        })
                    ):(
                        <tr  className={styles.previewItems} >
                            <td colSpan="5" className={styles.noStorageItems}>
                                <span>儲位尚無庫存</span>
                            </td>
                        </tr>
                        
                    )}
                </tbody>
            </table>
            <div className={styles.fastCreatePanel}>
                <h3>快速建立：</h3>
                <div className={styles.fastCreateInput}>
                    <label>名稱：
                        <input 
                            type="text"  
                            name="name" 
                            value={storageItem.name}
                            onChange={handleItemInputChange}
                        />
                    </label>
                    <label>數量：
                        <input 
                            type="number" 
                            name="amount" 
                            value={storageItem.amount} 
                            onChange={handleItemInputChange}
                        />
                    </label>
                    <label>單位：
                        <input 
                        type="text"  
                        name="unit" 
                        value={storageItem.unit}
                        onChange={handleItemInputChange}
                        />
                    </label>
                    <label>到期日期：
                        <input 
                            type="date" 
                            name="expired_date" 
                            value={storageItem.expired_date}
                            className={styles.dateInput} 
                            onChange={handleItemInputChange}
                        />
                    </label>
                </div>
                <div className={styles.fastCreateBtnPanel}>
                    <button
                        type="button"
                        name={storageName}
                        onClick={handleCreateStorageItem}
                        className={allInputValid ? styles.fastCreateBtn : styles.btnDisabled}
                        disabled={!allInputValid}
                    >
                        快速建立
                    </button>
                </div>
                <hr />
                <div 
                    className={styles.toModifyCardPanel}
                >
                    <div 
                        className={styles.iconPanel}
                        onClick={()=>{setIsModifyModalOpen(true)}}
                        data-id={id}
                    >
                        <ModeRounded/>
                        <span className={styles.modifyStorageName} >修改儲位名稱</span>
                    </div>
                    <div className={styles.iconPanel}
                        data-id={id}
                        onClick={handleDeleteStorage}
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
                storageName={storageName}
                setIsModifyModalOpen={setIsModifyModalOpen}
                onStorageNameUpdated={onStorageNameUpdated}
            />): null
            }
        </div>
    )
}

export default StorageCard;