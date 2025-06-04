
import styles from "./LodingPanel.module.scss"
const LoadingPanel =({ panelTitle, panelText})=>{
    
    return(
        <div className={styles.loadingPanel}>
            <div className={styles.loadingMask}>
                <div className={styles.loadingModal}>
                    <h3>{panelTitle}</h3>
                    <p>{panelText}</p>
                    <div className={styles.loadingCircle}>
                        <div className={styles.outterCircle}>
                            <div className={styles.innerCircle}></div>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    )
}

export default LoadingPanel;