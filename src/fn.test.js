import { updateBtnDisabled } from "./fn";


describe("updateBtnDisabled", () => {
    let mockSetBtnState;

    beforeEach(() => {
        // 創建一個 jest mock 函式，模擬 setBtnState
        mockSetBtnState = jest.fn();
    });

    test("應該啟用按鈕，當所有欄位皆為 true", () => {
        const fieldState = { email: true, password: true, username: true };

        updateBtnDisabled(fieldState, mockSetBtnState);

        // 驗證 setBtnState 被呼叫且參數為 false (按鈕啟用)
        expect(mockSetBtnState).toHaveBeenCalledWith(false);
    });

    test("應該禁用按鈕，當至少一個欄位為 false", () => {
        const fieldState = { email: true, password: false, username: true };

        updateBtnDisabled(fieldState, mockSetBtnState);

        // 驗證 setBtnState 被呼叫且參數為 true (按鈕禁用)
        expect(mockSetBtnState).toHaveBeenCalledWith(true);
    });

    test("應該禁用按鈕，當所有欄位皆為 false", () => {
        const fieldState = { email: false, password: false, username: false };

        updateBtnDisabled(fieldState, mockSetBtnState);

        // 驗證 setBtnState 被呼叫且參數為 true (按鈕禁用)
        expect(mockSetBtnState).toHaveBeenCalledWith(true);
    });
});
