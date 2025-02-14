
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

//時間(Timestamp)換算: 
export const getFormatedDate =(timeStampObj)=>{
    if(!timeStampObj  || (!timeStampObj._seconds && !timeStampObj.seconds) ){
        console.log('輸入時間格式不完整', timeStampObj)
        //中斷
        return
    }

    let nanoSecs = 0;
    let secs = 0;
    if(timeStampObj._seconds){
        nanoSecs = timeStampObj._nanoseconds
        secs = timeStampObj._seconds;
    }else{
        nanoSecs = timeStampObj.nanoseconds
        secs = timeStampObj.seconds;
    }
    const date = new Date((nanoSecs / 1e6) + secs * 1000)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

//時間(js date)轉換
export const formateDateFromJS = (jsDate)=>{
    const year = jsDate.getFullYear();
    const month = String(jsDate.getMonth() + 1).padStart(2, '0');
    const day = String(jsDate.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}






