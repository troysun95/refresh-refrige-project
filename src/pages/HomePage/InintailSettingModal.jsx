import styles from "./HomePage.module.scss"
import { useEffect, useState, useCallback } from "react";
import { updateUserSettingFiled,} from "../../config/firebase";
const InintailSettingModal = ({
    user, 
    inintialState,
    onReInitialize,
    setHasDefaultSet,
}) =>{
    const {refrige, freezer, hasUserGet, itemsInitialized} = inintialState;
    const [hasUpdated, setHasUpdated] = useState(false)
    

    const updateHasDafaultSet = useCallback(async()=>{
        const response = await updateUserSettingFiled(user, "hasDefaultStorageSet", true)
        if(response === "success"){
            localStorage.setItem('hasDefaultInitialize', true)
            setHasUpdated(true)
            setTimeout(()=>{
                setHasDefaultSet(true)
            }, 10000)  
        }else{
            setHasUpdated(false)
        }
    },[user, setHasDefaultSet])
    

    useEffect(()=>{
        if(refrige.hasSet && freezer.hasSet && itemsInitialized ){
            updateHasDafaultSet()
        }
    },[inintialState, refrige.hasSet, freezer.hasSet, itemsInitialized,updateHasDafaultSet])

    return(
        <div className={styles.initialModal}>
            <div className={styles.modalPanel}>
            {hasUserGet  ? (
                    <span>使用者資料載入成功!</span>
                ):(
                    <span >使用者資料載入中...</span>
                )}
                {/* 冷藏區 */}
                {refrige.isLoading && (
                    <span >冷藏區建立中</span>
                )}
                {refrige.hasSet && (
                    <span> 冷藏區建立完成</span>
                )}
                {(!refrige.hasSet && refrige.errorState === "reInitailze" ) && (
                        <>
                            <span>冷藏區建立失敗</span>
                            <button onClick={()=>{
                                onReInitialize("冷藏區", "refrige")
                            }}>重新設置冷藏區</button>
                        </>
                )}
                {/* 冷凍區 */}
                {freezer.isLoading && (
                    <span>冷凍區建立中</span>
                )}
                {freezer.hasSet && (
                    <span>冷凍區建立完成</span>
                )}
                {(!freezer.hasSet && freezer.errorState === "reInitailze") && (
                        <>
                            <span>冷凍區建立失敗</span>
                            <button onClick={()=>{
                                onReInitialize("冷凍區", "freezer")
                            }}>重新設置冷凍區</button>
                        </>
                )}
                {(refrige.errorState  === "unknown" || freezer.errorState  === "unknown") && (
                    <>
                        <span>未知問題，請聯絡開發人員</span>
                    </>
                )}
                {/* 項目集合初始化 */}

                {/* usersetting:hasDefaultStoragesSet 更新 */}
                {(refrige.hasSet && freezer.hasSet ) && (
                    <>
                        <span>{hasUpdated ? "初始化設置完成，請開始使用🤗" : "初始化設置失敗，請聯絡開發人員"}</span>
                    </>
                )}
            </div>
           
            <div className={styles.modalMask}></div>
        </div>
    )
}

export default InintailSettingModal;