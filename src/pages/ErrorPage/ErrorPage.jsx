import { useNavigate } from "react-router-dom"

const ErrorPage = ()=>{
    const navigate = useNavigate()
    return (
        <>
            <h3>this is ErrorPage!</h3>
            <button onClick={()=>{navigate('/login')}}>back to LoginPage</button>
        </>
    )   
}

export default ErrorPage