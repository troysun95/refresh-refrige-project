import {  useEffect, useState } from "react";
import styles from './HomePage.module.scss'
import {ArrowDropDown, ArrowLeft, ErrorRounded,} from "@mui/icons-material"
import { getFormatedDate } from "../../fn";

const ExpiredItemsSection= ({items})=>{
    const sectionTitle = Object.keys(items)
    const sectionItems = items[sectionTitle]
    const [formatedItems, setFomatedItems] =useState([])
    const [isDropDownOpen, setIsDropDownOpen] = useState(false)

    const getFormatedItmes =  async() => {
        try {
            const newItems = sectionItems.map((item)=>{
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

    useEffect(()=>{
        if(sectionItems){
            getFormatedItmes();
        }
    },[sectionItems.length])

    return(
        <>
            {items  ? (
                <div className={styles.expiredItemsSection}>
                    <div className={styles.sectionTitlePanel}>
                        <h3 
                            className={styles.sectionTitle}
                            onClick={()=>{setIsDropDownOpen(!isDropDownOpen)}} 
                        >
                            {sectionTitle}
                        </h3>
                        <span> 共 {sectionItems.length} 件</span>
                    </div>
                    <hr />
                    {isDropDownOpen ? (
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
                    ): null}
                </div>
                ):
                null}
        </>
        
    )
}



const ExpiredItemsPanel = ({expiredItems, itemsCount})=>{
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
            {expiredItems && itemsCount && expiredItems.length > 0 ? (
                <div className={styles.expiredItemsWrapper}>
                    
                    <div className={styles.countPanel}>
                        <div className={styles.panelTitle}> <ErrorRounded style={{color: "red", marginRight: "10px"}}/>過期項目總數 : 共{itemsCount}件</div>
                        <div 
                            className={styles.dropDownbtn}
                            onClick={hanleDropDownOpen}
                        >
                            {isDropDownOpen ?   < ArrowDropDown />  : <ArrowLeft/>}
                        </div>
                    </div>
                    <div className={styles.expiredItemsContainer}>
                        {isDropDownOpen ? (
                            expiredItems.map((items,index)=>{
                                return(
                                    <ExpiredItemsSection
                                        key={`expiredSection-${(index + 1)}`}
                                        items={items}
                                    />
                                )
                            })
                        ):null}
                    </div>
                </div>
            ):null}
        </>
        
    )
}

export default ExpiredItemsPanel;



