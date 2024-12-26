
import styles from "./LodingPanel.module.scss"
const LoadingPanel =({ panelTitle, panelText})=>{
    
    return(
        <div className={styles.loadingPanel}>
            <div className={styles.loadingMask}></div>
            <div className={styles.loadingModal}>
                <h3>{panelTitle}</h3>
                <p>{panelText}</p>
                <div className={styles.loadingCircle}>
                    OOO
                </div>
            </div>
        </div>
    )
}

export default LoadingPanel;