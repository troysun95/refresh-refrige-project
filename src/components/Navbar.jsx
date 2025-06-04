import { useEffect, useState } from "react";
import styles from "./Navbar.module.scss";
import {Menu, Home, Storage, Search, Logout} from "@mui/icons-material"
import { useAuth } from "../contexts/AuthContext";
import {auth, getAllStorages} from "../config/firebase"
import { signOut } from "firebase/auth";
import clsx from "clsx";
import { useNavigatePage } from "../contexts/NavigatePageContext";
import Swal from "sweetalert2";
const NavbarItem = ({
    itemTitle,
    itemIcon,
    handleClickNavItem,
    handelToSubnavItem,
    isDropDownOpen,
})=>{
    const [subItem, setSubItem] = useState([]);
    
    const fetchStorageNames = async () => {
        console.log('fetchStorageNames triggered')
        const user = auth.currentUser;
        const response  = await getAllStorages(user);
        if(response.status === "failed"){
            Swal.fire({
                title:"儲位讀取失敗",
                icon: "error"
            })
        }else{
            setSubItem(response.data)
        }
    }


    useEffect(()=>{
        if(itemTitle === "儲位區"){
            fetchStorageNames()
        }
    },[itemTitle])

    return(
        <div className={styles.navItemContainer}> 
            <div 
                className={styles.navItem}
                onClick={handleClickNavItem}
            >
                <div className={styles.itemIcon}>
                    {itemIcon}
                </div>
                <span className={styles.itemTitle}>{itemTitle}</span>
            </div>
            <div className={styles.navSubItem}>
                {isDropDownOpen && subItem && subItem.length ? (
                        subItem.map((item)=>{
                            return(
                                <div 
                                    id={item.id}
                                    className={styles.subItem}
                                    key={item.id}
                                    onClick={handelToSubnavItem}
                                >
                                    {item.storageTitle}
                                </div>
                                    
                            )
                        })
                    ):(
                        null
                    )}
            </div>
        </div>
    )
}


const LogoutItem =()=>{
    const {setIsUserSettingExist} = useAuth()
    const handleLogout = async()=>{
        try{
            setIsUserSettingExist(false)
            localStorage.removeItem('storageId')
            localStorage.removeItem('hasDefaultInitialize')
            await signOut(auth);
        }catch(err){
            console.log("fialed to logout")
        }
    }
    
    return(
        <div 
            className={styles.logoutItemContainer} 
            onClick={handleLogout}
        > 
            <div className={styles.logoutItem}>
                <Logout className={styles.logoutIcon}/>
                <span>登出</span>
            </div>
            
        </div>
    )
}

const Navbar =()=>{
    //const user = auth.currentUser;
    const { handleToHomePage, handelToStoragePage} = useNavigatePage();
    const [isNavbarOpen, setIsNavbarOpen]= useState(false)
    const [isDropDownOpen, setIsDropDownOpen] = useState(false);
    const handleDropDownSwitch= ()=>{
        setIsDropDownOpen(!isDropDownOpen)
    }
    const handleToStorageClicked = (e)=>{
        handelToStoragePage(e) 
        setIsNavbarOpen(false)
    }
    const navbarItems = [{
        id:'navItem01',
        title: "首頁",
        icon: <Home/>,
        handleClickNavItem: handleToHomePage,
    },{
        id:'navItem02',
        title: "儲位區",
        icon: <Storage/>,
        handleClickNavItem: handleDropDownSwitch,
        handelToSubnavItem: handleToStorageClicked
    },{
        id:'navItem03',
        title: "搜尋 菜價/食譜",
        icon: <Search/>,
    },]

    

    const handelNavbarOpen=()=>{
        if(isNavbarOpen){
            setIsNavbarOpen(false)
        }else{
            setIsNavbarOpen(true)
        }
    }




    return(
        <>
            <div className={clsx(styles.navbarWrapperClosed, {[styles.navbarWrapperOpen]: isNavbarOpen})}>
                <div className={styles.navbarContainer}>
                    {isNavbarOpen ? (
                        <>
                            <div 
                                className={styles.navbarMenuBtn}
                                onClick={handelNavbarOpen}
                            >
                                <Menu />
                            </div>
                            <div className={styles.navbar}>
                            {navbarItems.map((item)=>{
                                return(
                                    <NavbarItem
                                        key={item.id}
                                        itemTitle={item.title}
                                        itemIcon={item.icon}
                                        handleClickNavItem={item.handleClickNavItem}
                                        handelToSubnavItem={item.handelToSubnavItem}
                                        isDropDownOpen={isDropDownOpen}
                                    />
                                )
                            })}
                                <LogoutItem />
                            </div>
                        </>
                        
                    ): (
                        <>
                            <div  
                                className={styles.navbarMenuBtn}
                                onClick={handelNavbarOpen}
                            >
                                <Menu/>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/* navbar Mask */}
            {isNavbarOpen ? (
                <div className={styles.navbarmask}
                    onClick={()=>{
                        setIsNavbarOpen(false)
                    }}
                >
                </div>): null
            }
            
        </>
       
    )
}

export default Navbar;