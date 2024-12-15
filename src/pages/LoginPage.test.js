import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import LoginPage from "./LoginPage";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { getDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import { useAuth } from "../contexts/AuthContext";

// Mock Firebase 函式
jest.mock("firebase/auth", () => ({
    signInWithEmailAndPassword: jest.fn(),
    signInWithPopup: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
    getDoc: jest.fn(),
}));

jest.mock("sweetalert2", () => ({
    fire: jest.fn(),
}));

jest.mock("../contexts/AuthContext", () => ({
    useAuth: jest.fn(),
}));

describe("LoginPage Tests", () => {
    const mockSetIsUsercollectionExist = jest.fn();
    const mockNavigate = jest.fn();

    beforeEach(() => {
        useAuth.mockReturnValue({
            setIsUsercollectionExist: mockSetIsUsercollectionExist,
        });
    });

    test("renders LoginPage correctly", () => {
        render(
            <Router>
                <LoginPage />
            </Router>
        );

        expect(screen.getByText("this is LoginPage!")).toBeInTheDocument();
    });

    test("input fields and button are rendered", () => {
        render(
            <Router>
                <LoginPage />
            </Router>
        );

        const emailInput = screen.getByPlaceholderText(/email/i);
        const passwordInput = screen.getByPlaceholderText(/password/i);
        const loginButton = screen.getByText("登入");

        expect(emailInput).toBeInTheDocument();
        expect(passwordInput).toBeInTheDocument();
        expect(loginButton).toBeInTheDocument();
    });

    test("handleLoginWithEmailAndPassword works correctly", async () => {
        render(
            <Router>
                <LoginPage />
            </Router>
        );

        const mockUser = { user: { uid: "123" } };
        signInWithEmailAndPassword.mockResolvedValueOnce(mockUser);
        getDoc.mockResolvedValueOnce({ exists: true });

        const emailInput = screen.getByPlaceholderText(/email/i);
        const passwordInput = screen.getByPlaceholderText(/password/i);
        const loginButton = screen.getByText("登入");

        // Set valid inputs
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
        fireEvent.change(passwordInput, { target: { value: "validpassword" } });

        // Enable the button after validation
        fireEvent.click(loginButton);

        await waitFor(() => {
            expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
                expect.anything(),
                "test@example.com",
                "validpassword"
            );
            expect(mockSetIsUsercollectionExist).toHaveBeenCalledWith(true);
        });
    });

    test("handleLoginWithGoogle works correctly", async () => {
        render(
            <Router>
                <LoginPage />
            </Router>
        );

        const mockGoogleUser = { user: { uid: "123" } };
        signInWithPopup.mockResolvedValueOnce(mockGoogleUser);
        getDoc.mockResolvedValueOnce({ exists: true });

        const googleButton = screen.getByText("Google 按鈕");

        fireEvent.click(googleButton);

        await waitFor(() => {
            expect(signInWithPopup).toHaveBeenCalledWith(expect.anything(), expect.anything());
            expect(mockSetIsUsercollectionExist).toHaveBeenCalledWith(true);
        });
    });

    test("handles login error with Google", async () => {
        render(
            <Router>
                <LoginPage />
            </Router>
        );

        const errorMessage = "auth/cancelled-popup-request";
        signInWithPopup.mockRejectedValueOnce({ message: errorMessage });

        const googleButton = screen.getByText("Google 按鈕");

        fireEvent.click(googleButton);

        await waitFor(() => {
            expect(Swal.fire).toHaveBeenCalledWith({
                title: "使用者登入失敗",
                text: "請求過多受阻，請稍後再嘗試",
                icon: "error",
            });
        });
    });
});
