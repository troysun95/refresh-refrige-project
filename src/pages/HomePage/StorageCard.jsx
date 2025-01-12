
import styles from './HomePage.module.scss'
import { useState, useEffect } from "react";
import {v4 as uuidv4} from 'uuid';
import { getStorageItems, createStorageItem} from '../../config/firebase';
import { getFormatedDate } from '../../fn';
import { Timestamp } from 'firebase/firestore';

const StorageCard = ({storageName, user, onItemCreated })=>{
    const [previewItems, setPreviewItems] = useState([])
    const [storageItem, setStorageItem ]= useState({
        name:"",
        amount: "",
        unit: "",
        expired_date: "",
    })

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
            console.log('StorageCard storageName 尚未傳入')
        } 
    }
    

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
        console.log(jsExpiredDate, 'timestamp 格式', Timestamp.fromDate(jsExpiredDate))
        const isInputValid = checkInputValid(storageItem)
        if(!isInputValid){
            alert("欄位請勿為空白")
            return
        }else{
            const itemUuid = uuidv4();
            const newItem = {
                id: itemUuid,
                name: storageItem.name,
                amount : storageItem.amount,
                unit : storageItem.unit,
                expired_date: jsExpiredDate,
                created_at: jsCreateDate,
            }
            
            await createStorageItem(user, storageName, newItem);

          

            if (onItemCreated) {
                onItemCreated();
            }
            await fetchStoragePreviewData()
            setStorageItem({
                name:"",
                amount: "",
                unit: "",
                expired_date: "",
            })
        }
       
    }

    const checkInputValid =(storageItem)=>{
        return Object.values(storageItem).every((value) => value);
    }


    useEffect(()=>{
        if(storageName){
            fetchStoragePreviewData()
        }
    },[storageName])

    return (
        <div
            className={styles.storageCardContainer}
        >
            <div className={styles.storageCardTitle}>
                {storageName}
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
                                <tr className={styles.previewItem} key={item?.id}>
                                    <td className={styles.nameItem}>{item?.name}</td>
                                    <td className={styles.amountItem}>{item?.amount}</td>
                                    <td className={styles.unitItem}>{item?.unit}</td>
                                    <td className={styles.dateItem}>{item?.expired_date}</td>
                                    <td className={styles.dateItem}>{item?.created_at}</td>
                                </tr>
                            )
                        })
                        
                    ):(
                        <tr>
                            <td colSpan="5" className={styles.noStorageItems}>
                                儲位尚無庫存
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
                            type="text" 
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
                <button
                    type="button"
                    name={storageName}
                    onClick={handleCreateStorageItem}
                    className={styles.fastCreateBtn}
                >快速建立
                </button>
            </div>
            
        </div>
    )
}

export default StorageCard;