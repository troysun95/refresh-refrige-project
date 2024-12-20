import { updateBtnDisabled } from "./fn";

describe("updateBtnDisabled", () => {
    let mockSetBtnState;

    beforeEach(() => {
        // 創建一個 jest mock 函式，模擬 setBtnState
        mockSetBtnState = jest.fn();
    });

    test("loading 進行中，所有欄位皆為 true, 應該禁用按鈕", () => {
        const fieldState = { email: true, password: true, username: true };
        const isLoading = true
        updateBtnDisabled(fieldState, mockSetBtnState, isLoading);

        // 驗證 setBtnState 被呼叫且參數為 true (按鈕禁用)
        expect(mockSetBtnState).toHaveBeenCalledWith(true);
    });


    test("loading 進行中，當至少一個欄位為 false, 應該禁用按鈕", () => {
        const fieldState = { email: true, password: true, username: true };
        const isLoading = true
        updateBtnDisabled(fieldState, mockSetBtnState, isLoading);

        // 驗證 setBtnState 被呼叫且參數為 true (按鈕禁用)
        expect(mockSetBtnState).toHaveBeenCalledWith(true);
    });

    test("loading 未進行時，當至少一個欄位為 false，應該禁用按鈕，", () => {
        const fieldState = { email: true, password: false, username: true };
        const isLoading = false
        updateBtnDisabled(fieldState, mockSetBtnState, isLoading);

        // 驗證 setBtnState 被呼叫且參數為 true (按鈕禁用)
        expect(mockSetBtnState).toHaveBeenCalledWith(true);
    });
    
    test("loading 未進行時，當所有欄位皆為 true，應該啟用按鈕", () => {
        const fieldState = { email: true, password: true, username: true };
        const isLoading = false
        updateBtnDisabled(fieldState, mockSetBtnState, isLoading);

        // 驗證 setBtnState 被呼叫且參數為 false (按鈕啟用)
        expect(mockSetBtnState).toHaveBeenCalledWith(false);
    });
});
