import styles from "./BrandHeader.module.scss";
import {Kitchen} from "@mui/icons-material";
import { useNavigatePage } from "../contexts/NavigatePageContext";
const BrandHeader = ()=>{
    const {handleToHomePage} = useNavigatePage();
    return(
        <>
            <div className={styles.pageHeader}>
                <div 
                    className={styles.brandLogo}
                    onClick={handleToHomePage} 
                >
                    <Kitchen className={styles.brandICon}/>
                    <span  className={styles.brandTitle}>Refresh Refrige</span>
                </div>
            </div>
        </>
    )
}

export default BrandHeader;