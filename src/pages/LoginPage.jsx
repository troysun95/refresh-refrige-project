import { signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {auth, provide} from "../config/firebase"

const LoginPage =()=>{
    const navigate = useNavigate();
    const handleLogin = async()=>{
        const result = await signInWithPopup(auth, provide)
        navigate('/home')
        //console.log(' 登入跳轉 home', result.user.displayName)    
    }

    return (
        <>
            <div>this is LoginPage!</div>
            <button onClick={handleLogin}>Google 按鈕</button>
            <button onClick={()=>{navigate('/signup')}}>Click to sign up</button>
        </>
    )
}

export default  LoginPage;