import {  useEffect, useState } from "react";
import styles from './HomePage.module.scss'
import {ArrowDropDown, ArrowLeft, ErrorRounded,} from "@mui/icons-material"
import { getFormatedDate } from "../../fn";

const ExpiredItemsSection= ({items, onButtonClicked})=>{
    
    const [formatedItems, setFomatedItems] =useState([])
    const [isDropDownOpen, setIsDropDownOpen] = useState(false)

    const getFormatedItmes =  async() => {
        try {
            const newItems = items.items.map((item)=>{
                const itemFormated = {
                    ...item, 
                    created_at: getFormatedDate(item.created_at),
                    expired_date : getFormatedDate(item.expired_date)
                } 
                return itemFormated
            })
            setFomatedItems(newItems)
        } catch (error) {
            console.error("Fialed to foremate items",error)
        }
    }

    const handleClick = (e)=>{
        const name = e.target.name;
        const elementWithId = e.target.closest.dateset("id")
        if(!elementWithId){
            console.log('無對應 id 元素')
            return 
        }else{
            onButtonClicked(elementWithId.id, name)
        }
    }

    useEffect(()=>{
        if(items){
            getFormatedItmes();
        }
    },[items.length])

    return(
        <>
            {items  ? (
                <div className={styles.expiredItemsSection}>
                    <div className={styles.sectionTitlePanel}>
                        <h3 
                            className={styles.sectionTitle}
                            onClick={()=>{setIsDropDownOpen(!isDropDownOpen)}} 
                        >
                            {items.storageTitle}
                        </h3>
                        <div>
                            <span>共 {items.totalCount}</span>
                        </div>
                    </div>
                    <hr />
                    {isDropDownOpen ? (
                        <>
                            <table className={styles.expiredItems}>
                                <thead>
                                    <tr className={styles.itemTitles}>
                                        <th className={styles.itemTitle}>名稱</th>
                                        <th className={styles.itemTitle}>數量</th>
                                        <th className={styles.itemTitle}>單位</th>
                                        <th className={styles.itemTitle}>到期日期</th>
                                        <th className={styles.itemTitle}>建立日期</th>
                                    </tr>
                                </thead>
                                <tbody >
                                    {formatedItems && formatedItems.map((formatedItem)=>{
                                        return  (
                                                <tr className={styles.expiredItem} key={formatedItem?.id}>
                                                    <td className={styles.nameItem}>{formatedItem?.name}</td>
                                                    <td className={styles.amountItem}>{formatedItem?.amount}</td>
                                                    <td className={styles.unitItem}>{formatedItem?.unit}</td>
                                                    <td className={styles.dateItem}>{formatedItem?.expired_date}</td>
                                                    <td className={styles.dateItem}>{formatedItem?.created_at}</td>
                                                </tr>
                                        )
                                    })}
                                </tbody>    
                            </table>
                            <div data-id={items.items.storageId}>
                                {items.items.error &&  <>
                                    <span>{items.error}</span>
                                    <button
                                        onClick={handleClick}
                                        name="recheck"
                                    >
                                        重新讀取
                                    </button>
                                </>}
                                {items.hasMore && <>
                                    <button
                                        onClick={handleClick}
                                        name="getmore"
                                    >
                                        載入更多
                                    </button>
                                </>}
                            </div>
                        </>
                    ): null}
                </div>
                ):
                null}
        </>
        
    )
}



const ExpiredItemsPanel = ({
    isLoading,
    fetchError,
    expiredItems, 
    onButtonClicked,
    expiredItemsCount,
})=>{
    const [isDropDownOpen, setIsDropDownOpen] = useState(false);
    const hanleDropDownOpen =()=>{
        if(!isDropDownOpen){
            setIsDropDownOpen(true)
        }else{
            setIsDropDownOpen(false)
        }
    }
    return(
        <>
            {isLoading.expiredPanel ? (
                <span>過期項目檢查中...</span>
            ): (
                expiredItems  && expiredItems.length > 0 ? (
                    <div className={styles.expiredItemsWrapper}>
                        <div className={styles.countPanel}>
                            <div className={styles.panelTitle}> 
                                {expiredItemsCount > 0 ? (
                                    <>
                                        <ErrorRounded style={{color: "red", marginRight: "10px"}}/>
                                        過期項目總數 : 共{expiredItemsCount}件
                                    </>
                                ): (
                                    <>
                                    {fetchError.expiredPanel  ? " !!過期項目檢查失敗": "無過期項目"}
                                    </>
                                )}
                            </div>
                            {expiredItemsCount > 0 ? (
                                <div 
                                    className={styles.dropDownbtn}
                                    onClick={hanleDropDownOpen}
                                >
                                    {isDropDownOpen ?   < ArrowDropDown />  : <ArrowLeft/>}
                                </div>
                                ):null
                            }
                        </div>
                        <div className={styles.expiredItemsContainer}>
                            {isDropDownOpen ? (
                                expiredItems.map((items,index)=>{
                                    return(
                                        <ExpiredItemsSection
                                            key={`expiredSection-${(index + 1)}`}
                                            items={items}
                                            onButtonClicked={onButtonClicked}
                                        />
                                    )
                                })
                            ):null}
                        </div>
                    </div>
                ):null
            )}
            
        </>
        
    )
}



export default ExpiredItemsPanel;



