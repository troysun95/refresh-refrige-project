import {auth} from "../config/firebase";

const HomePage = ()=>{

    return(
        <>
            <h3>this is HomePage</h3>
            {/* show auth content */}
            <div className="userName">
                <span>userName: {auth?.currentUser.displayName}</span>
            </div>
        </>
    )
}

export default HomePage