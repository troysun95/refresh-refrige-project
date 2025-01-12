//通用函式

//由 inuput 是否判斷為有效，切換按鈕可點擊性
export const updateBtnDisabled = (fieldState, setBtnState, isLoading)=>{
    //設一個起始值
    let btnDisabled = true
    if(!isLoading){
        btnDisabled = false
        for(let key in fieldState){
            if(!fieldState[key]){
                btnDisabled = true
                break
            }
        }
    }
    setBtnState(btnDisabled)
}

//時間(Timestamp)換算
export const getFormatedDate =(timeStampObj)=>{
    if(!timeStampObj  || !timeStampObj.seconds ){
        console.log('輸入時間格式不完整', timeStampObj)
        //中斷
        return
    }
    const nanoSecs = timeStampObj.nanoseconds;
    const secs = timeStampObj.seconds;
    const date = new Date((nanoSecs / 1e6) + secs * 1000)
    return date.toLocaleDateString("zh-TW",{
        year:"numeric",
        month:"2-digit",
        day:"2-digit",
    })
}





