//通用函式

//由 inuput 是否判斷為有效，切換按鈕可點擊性
export const updateBtnDisabled = (fieldState, setBtnState)=>{
    //設一個起始值
    let isAllValid = true
    //filedState裡面每一項遍歷
    for(let key in fieldState){
        //空值與無欄位者，判定為 false
        if(!fieldState[key]){
            isAllValid = false
            //判為無效馬上結束
            break
        }
    }
    setBtnState(!isAllValid)
}
