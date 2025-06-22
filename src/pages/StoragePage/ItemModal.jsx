import { useEffect, useState, useCallback } from "react";
import styles from "./StoragePage.module.scss";
import { Close } from "@mui/icons-material";
import { getItemById, auth, updateItemById, createStorageItem } from "../../config/firebase";
import { getFormatedDate } from "../../fn";

const ItemModal =({
    storageId,
    isToCreate,
    setIsModalOpen,
    modalItemId,
    onItemUpdated,
    onItemCreated,
    isModalOpen,
})=>{
    
    const user = auth.currentUser;
    const [itemData, setItemData] = useState({
        name: "",
        amount: "",
        unit: "",
        expired_date: "",
        created_at: "",
        notes: "",
    });
    const [checkMsg, setCheckMsg] = useState({
        name: { type: "", text: " " },
        amount: { type: "", text: "" },
        unit: { type: "", text: "" },
        expired_date: { type: "", text: "" },
        notes: { type: "", text: " " },
        created_at: { type: "", text: "" },
    });
    const [btnDisabled, setBtnDisabled] = useState(false);
    const [hasInputChanged, setHasInputChanged] = useState(false);
    const [notifyContent, setNotifyContent] = useState({ type: "", text: "" });
    const [isProcessing, setIsProcessing] = useState(false)

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const setInputValid = (name, value) => {
        const numberRegrex =  /^[0-9]*\.?[0-9]*$/;
        if (name !== "notes" && !value.trim()) {
            return { type: "error", text: "欄位不可為空白" };
        }
        if (name === "amount" ) {
            if(value <= 0 ){
                return { type: "error", text: "數量必須大於 0 " };
            }
            if(!numberRegrex.test(value)){
                return { type: "error", text: "輸入數值須為整數或小數" };
            }
        }
        if (name === "notes" && value.length > 500) {
            return { type: "error", text: "字數不可超過 500" };
        }
        //建立日期不能超過今天
        if(name === "created_at"){
            if (new Date(value) > new Date()){
                return {
                    type: "error",
                    text: "建立日期不可超過今天"
                }
            }
        }
        return { type: "", text: "" };
    };

    const handleInputChange = (e) => {
        setHasInputChanged(true); 
        const { name, value } = e.target;
        setItemData((prev) => ({ ...prev, [name]: value }));
        setCheckMsg((prev) => ({ ...prev, [name]: setInputValid(name, value) }));
    };

    const switchBtnDisabled = useCallback(() => {
        const checkMsgItems = Object.values(checkMsg);
        const checkIsInputEmpty = () => {
            return (itemData.name && itemData.amount && itemData.expired_date && itemData.unit) ? false : true;
        };
        const isInputEmpty = checkIsInputEmpty();
        const isAllValid = checkMsgItems.every(element => element.type !== "error");
        if (isToCreate) {
            setBtnDisabled(!(isAllValid && !isInputEmpty)); 
        } else {
            setBtnDisabled(!(hasInputChanged && isAllValid && !isInputEmpty));
        }
    },[itemData, checkMsg, isToCreate,  hasInputChanged])
        

    const handleCreateItem = async () => {
        setIsProcessing(true)
        setNotifyContent({ type: "", text: "新增項目中" })
        setBtnDisabled(true)
        const jsCreateDate = new Date();
        const jsExpiredDate = new Date(itemData.expired_date);
        const newItem = { 
            ...itemData, 
            expired_date: jsExpiredDate, 
            created_at: jsCreateDate ,
            storageId : storageId,
        };
        const {status , itemId} = await createStorageItem(user, newItem);

        if (status === "success" && itemId) {
            setNotifyContent({ type: "", text: "項目新增成功" });
            setIsProcessing(false)
            //重新渲染畫面
            onItemCreated(newItem, itemId);
            setTimeout(() => {
                setNotifyContent({ type: "", text: "" });
                
                setIsModalOpen(false);

            }, 3000);
        } else {
            setNotifyContent({ type: "error", text: "項目新增失敗" });
            setIsProcessing(false)
        }
    };

    const handleUpdateItemData = async () => {
        setIsProcessing(true)
        setNotifyContent({ type: "", text: "項目更新中" });
        setBtnDisabled(true)
        const newItemData = {
            ...itemData,
            expired_date: new Date(itemData.expired_date),
            created_at: new Date(itemData.created_at),
        };

        const updateState = await updateItemById(user, modalItemId, newItemData);

        if (updateState === "success") {
            setNotifyContent({ type: "", text: "項目更新成功" });
            if (onItemUpdated) {
                onItemUpdated(modalItemId, newItemData);
            }
            setIsProcessing(false)
            setTimeout(() => {
                setNotifyContent({ type: "", text: "" });
                
                setIsModalOpen(false)
            }, 3000);
        } else {
            setNotifyContent({ type: "error", text: "項目更新失敗" });
            setIsProcessing(false)
        }
    };

    const fetchStorageItemById = useCallback(async () => {
        const response = await getItemById(user, modalItemId);
        if (response.status === "success") {
            const data = response.data;
            const formatedData = {
                ...data,
                expired_date: getFormatedDate(data.expired_date),
                created_at: getFormatedDate(data.created_at),
            };
            setItemData(formatedData);
        } else {
            if(response.error){
                console.log(`讀取 id ${modalItemId}失敗`,response.error);   
            }else{
                console.log(`點擊 id 不存在`)
            }
        }
    },[user, modalItemId])
   

    const initailItemData = () => {
        setItemData({
            name: "",
            amount: "",
            unit: "",
            expired_date: "",
            created_at: "",
            notes: ""
        });
    };

    useEffect(() => {
        if (!isToCreate && modalItemId) {
            fetchStorageItemById();
        }
    }, [isToCreate, modalItemId, fetchStorageItemById]);

    useEffect(() => {
        if (!modalItemId) {
            initailItemData();
        }
    }, [isToCreate, modalItemId]);

    useEffect(() => {
        setHasInputChanged(false);
    }, [isModalOpen]);

    useEffect(() => {
        switchBtnDisabled();
    }, [checkMsg, itemData, hasInputChanged, isToCreate, switchBtnDisabled]); 


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
                    <label>名稱 :
                        <input 
                            type="text" 
                            name="name" 
                            defaultValue={itemData.name}
                            onChange={handleInputChange}
                        />
                        <span style={{color: `${checkMsg["name"].type === "error" ? "red" : "black"}`}}>
                            {checkMsg["name"].text }
                        </span>
                    </label>
                    <label>數量 :
                        <input 
                            type="number" 
                            name="amount" 
                            defaultValue={itemData.amount}
                            onChange={handleInputChange}
                        />
                        <span style={{color: `${checkMsg["amount"].type === "error" ? "red" : "black"}`}}>
                            {checkMsg["amount"].text }
                        </span>
                    </label>                    
                    <label>單位 :
                        <input 
                            type="text" 
                            name="unit" 
                            defaultValue={itemData.unit}
                            onChange={handleInputChange}
                        />
                        <span style={{color: `${checkMsg["unit"].type === "error" ? "red" : "black"}`}}>
                            {checkMsg["unit"].text }
                        </span>
                    </label>                    
                    <label>到期日期 :
                        <input 
                            type="date" 
                            name="expired_date" 
                            defaultValue={itemData.expired_date}
                            onChange={handleInputChange}
                        />
                        <span style={{color: `${checkMsg["expired_date"].type === "error" ? "red" : "black"}`}}>
                            {checkMsg["expired_date"].text }
                        </span>
                    </label>    
                    {!isToCreate && (
                        <label className={styles.createAt}>建立日期 : 
                            <input 
                                type="date" 
                                name="created_at" 
                                defaultValue={itemData.created_at}
                                onChange={handleInputChange}
                                max={new Date().toISOString().split("T")[0]}
                            />
                            <span style={{color: `${checkMsg["created_at"].type === "error" ? "red" : "black"}`}}>
                            {checkMsg["created_at"].text }
                            </span>
                        </label>
                    )}            
                    <div className={styles.itemNotesPanel}>
                        <span>備註</span>
                        <textarea 
                            name="notes" 
                            id="" 
                            placeholder={`${!itemData.notes && "  為項目留下備註(字數上限為 500)"}`}
                            defaultValue={itemData?.notes}
                            onChange={handleInputChange}
                            className={styles.itemNotesContainer}
                        >
                        </textarea>
                        <span style={{color: `${checkMsg["notes"].type === "error" ? "red" : "black"}`}}>
                            {checkMsg["notes"].text }
                        </span>
                    </div>
                    {/* 圖片區 */}
                    {/* <div>
                        <span>圖片</span>   
                        {itemData?.hasPicture ? (
                            <>
                                <button></button>
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
                    </div> */}
                </div>
                    <div className={styles.btnPanel}>
                        {isProcessing ? (
                            <button>處理中...</button>
                        ):(<>
                            <button onClick={handleCloseModal}>取消</button>
                            {isToCreate ? (
                                    <button 
                                        onClick={()=>{
                                            //setIsProcessing(true)
                                            handleCreateItem()
                                        }}
                                        disabled={btnDisabled}
                                    >   
                                        新增
                                    </button>
                                ):(
                                    <button 
                                    onClick={()=>{
                                        //setIsProcessing(true)
                                        handleUpdateItemData()
                                    }} 
                                        disabled={btnDisabled}
                                    >
                                        更新
                                    </button>
                                )
                            }
                        </>)} 
                    </div>
                    <div>{isProcessing ? "處理中" :"尚未開始"} </div>
                    {notifyContent.text.length > 0  ?(
                        <>
                            <div className={styles.notifyPopout}>
                                <span style={{color: `${notifyContent.type === "error" ? "red" : "blue"}`}}>
                                    {notifyContent.text} 
                                </span>
                            </div>
                        </>
                    ):null }
            </div>
        </>
    )
}

export default ItemModal;