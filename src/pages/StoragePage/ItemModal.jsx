import { useEffect, useState } from "react";
import styles from "./StoragePage.module.scss";
import { Close } from "@mui/icons-material";
import { getStorageItemById, auth, updateStorageItem } from "../../config/firebase";
import { getFormatedDate } from "../../fn";

const ItemModal =({
    isToCreate,
    setIsModalOpen,
    modalItemId,
    storageName,
    onItemUpdated,
})=>{
    const user = auth.currentUser
    const [itemData, setItemData] =useState({
        name:"",
        amount: "",
        unit: "",
        expired_date: "",
        created_at: "",
        hasPicture: false,
        notes: ""
    })
    const [notifyContent, setNotifyContent] = useState("")

    const handleCloseModal =()=>{
        setIsModalOpen(false)
    }

    const handleInputChange= (e)=>{
        const {name, value } = e.target;
        setItemData((prev)=>({
            ...prev,
            [name]: value,
        }))
    }



    const handleCreateItem =async()=>{

    }

    const handleUpdateItemData = async()=>{
        const newItemData = {
            ...itemData,
            expired_date : new Date(itemData.expired_date),
            created_at: new Date(itemData.created_at),
        }
        const updateState = await updateStorageItem(user, storageName, modalItemId, newItemData)
        if(updateState === "success") {
            setNotifyContent("更新項目資料成功")
            if(onItemUpdated){
                //回調重新 fethch item 
                onItemUpdated(modalItemId)
            }
            setTimeout(()=>{
                setIsModalOpen(false)
            }, 3000)
        }else{
            setNotifyContent("更新項目資料失敗！")
        }
    }


    const handleDeleteItem = async()=>{
        //awiat 資料更新
        //根據回傳條件，執行 notify
    }


    const fetchStorageItemById = async () => {
        const dataObj = await getStorageItemById(user, storageName, modalItemId)
        if(dataObj){
            const formatedData = {
                ...dataObj,
                expired_date: getFormatedDate(dataObj.expired_date),
                created_at: getFormatedDate(dataObj.created_at)
            }
            setItemData(formatedData)
        }else{
            console.log('對應 id 資料不存在！')
        }
    }


    useEffect(()=>{
        if(!isToCreate && modalItemId){
            fetchStorageItemById()
        }
    },[isToCreate, modalItemId])
    return(
        <>
            <div className={styles.modalWraper}>
                <div className={styles.titlePanel}>
                    <h3>
                        {isToCreate ? (
                            "新增項目"
                        ): (
                            "修改項目"
                        )}
                    </h3>
                    <div 
                        
                        onClick={handleCloseModal}
                    >
                        <Close className={styles.closeIcon}/>
                    </div>
                </div>
                <div className={styles.contentContainer}>
                    <label>名稱
                        <input 
                            type="text" 
                            name="name" 
                            defaultValue={itemData.name}
                            onChange={handleInputChange}
                        />
                    </label>
                    <label>數量
                        <input 
                            type="number" 
                            name="amount" 
                            defaultValue={itemData.amount}
                            onChange={handleInputChange}
                        />
                    </label>                    
                    <label>單位
                        <input 
                            type="text" 
                            name="unit" 
                            defaultValue={itemData.unit}
                            onChange={handleInputChange}
                        />
                    </label>                    
                    <label>到期日期
                        <input 
                            type="date" 
                            name="expired_date" 
                            defaultValue={itemData.expired_date}
                            onChange={handleInputChange}
                        />
                        <span>{itemData.expired_date}</span>
                    </label>    
                    {!isToCreate && (
                        <div>建立日期
                            <span>{itemData?.created_at}</span>
                        </div>
                    )}            
                    <div>
                        <span>照片</span>   
                        {itemData?.hasPicture ? (
                            <>
                                <div>
                                    <img src="" alt="" />
                                </div>
                            </>
                            
                        ):(
                            <>
                                <span>尚未新增照片</span>
                                <button>上傳照片</button>
                                <div>(請留意照片容量限制)</div>
                            </>
                        )}
                    </div>
                    <div>
                        <span>備註</span>
                        <textarea 
                            name="" 
                            id="" 
                            placeholder={!itemData.notes && "留下備註(字數上限為 500)"}
                            defaultValue={itemData?.notes}

                        >

                        </textarea>
                    </div>
                </div>
                
                    <div className={styles.btnPanel}>
                        <button onClick={handleCloseModal}>取消</button>
                        {isToCreate ? (
                                <button >新增</button>
                            ):(
                                <button onClick={handleUpdateItemData}>更新</button>
                            )
                        }
                       
                    </div>
                <div className={styles.notifyPopout}>
                    {notifyContent}
                </div>
                <div className={styles.modalMask}></div>
            </div>
            
        </>
    )
}

export default ItemModal