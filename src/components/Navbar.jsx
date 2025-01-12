import { useEffect, useState } from "react";
import styles from "./Navbar.module.scss";
import {Menu, Home, Storage, Search, Logout} from "@mui/icons-material"
import { useAuth } from "../contexts/AuthContext";
import {auth, getAllStorageTitles} from "../config/firebase"
import { signOut } from "firebase/auth";
import clsx from "clsx";
//import { useNavigate } from "react-router-dom";

const NavbarItem = ({
    itemTitle,
    itemIcon
})=>{
    const user = auth.currentUser
    const [subItem, setSubItem] = useState();
    
    const fetchStorageNames = async () => {
        if(itemTitle === "儲位區"){
            const user = auth.currentUser;
            const storageNames = await getAllStorageTitles(user);
            setSubItem(storageNames)
        }else{
            setSubItem(null)
        }
    }
    useEffect(()=>{
        fetchStorageNames()
    },[user])

    return(
        <div className={styles.navItemContainer}> 
            <div className={styles.navItem}>
                <div className={styles.itemIcon}>
                    {itemIcon}
                </div>
                <span className={styles.itemTitle}>{itemTitle}</span>
            </div>
            <div className={styles.navSubItem}>
                {subItem && subItem.length ? (
                        subItem.map((item)=>{
                            return(
                                <div 
                                    className={styles.subItem}
                                    key={item.storageDocId}
                                >
                                    <span>{item.storageTitle}</span>
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
            console.log(`使用者${auth?.currentUser.displayName}登出`)
            setIsUserSettingExist(false)
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
    const [isNavbarOpen, setIsNavbarOpen]= useState(false)
    const navbarItems = [{
        id:'navItem01',
        title: "首頁",
        icon: <Home/>,
    },{
        id:'navItem02',
        title: "儲位區",
        icon: <Storage/>,
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
    )
}

export default Navbar;