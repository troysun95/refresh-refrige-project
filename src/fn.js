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
