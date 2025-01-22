


import { createContext, useContext, } from "react";
import { useNavigate } from "react-router-dom";

const NavigatePageContext = createContext();

export const NavigatePageProvider = ({ children }) => {
    const navigate = useNavigate();

    const handelToStoragePage =(e)=>{
        const storageName = e.target.innerText;
        if(storageName){
            navigate(`/storage/${storageName}`)
        }
    }

    const handleToHomePage =()=>{
        navigate('/home')
    }
    
    const hadndleToSearchPage =()=>{
        navigate('.search')
    }
    
    return (
        <NavigatePageContext.Provider
            value={{
                handelToStoragePage,
                handleToHomePage,
                hadndleToSearchPage,
            }}
        >
            {children}
        </NavigatePageContext.Provider>
    );
};

export const useNavigatePage = () => useContext(NavigatePageContext);
