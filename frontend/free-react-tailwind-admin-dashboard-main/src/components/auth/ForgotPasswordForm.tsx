import { useState } from "react";
import { Link } from "react-router-dom";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "../../icons";

const API_BASE_URL = "http://localhost:8080/api";

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState("");
    const [securityQuestion, setSecurityQuestion] = useState("");
    const [securityAnswer, setSecurityAnswer] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: email, 2: security question, 3: new password

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/auth/forgot-password?email=${encodeURIComponent(email)}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Email not found");
            }

            setSecurityQuestion(data.data.securityQuestion);
            setStep(2);
        } catch (err: any) {
            setError(err.message || "Email not found. Please check and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(
                `${API_BASE_URL}/auth/reset-password?email=${encodeURIComponent(email)}&securityAnswer=${encodeURIComponent(securityAnswer)}&newPassword=${encodeURIComponent(newPassword)}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to reset password");
            }

            setSuccess("Password reset successfully! You can now sign in with your new password.");
            setStep(3);
        } catch (err: any) {
            setError(err.message || "Failed to reset password. Please check your answer and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1">
            <div className="w-full max-w-md pt-10 mx-auto">
            </div>
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                <div>
                    <div className="mb-5 sm:mb-8">
                        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                            Forgot Password - Reset Your Password
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Reset your password using your security question
                        </p>
                    </div>
                    <div>
                        <div className="relative py-3 sm:py-5">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
                            </div>
                        )}

                        {/* Step 1: Enter Email */}
                        {step === 1 && (
                            <form onSubmit={handleEmailSubmit}>
                                <div className="space-y-6">
                                    <div>
                                        <Label>
                                            Email <span className="text-error-500">*</span>
                                        </Label>
                                        <Input
                                            type="email"
                                            placeholder="Enter your email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Button
                                            className="w-full"
                                            size="sm"
                                            type="submit"
                                            disabled={isLoading || !email}
                                        >
                                            {isLoading ? "Verifying..." : "Continue"}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* Step 2: Answer Security Question and Set New Password */}
                        {step === 2 && (
                            <form onSubmit={handlePasswordReset}>
                                <div className="space-y-6">
                                    <div>
                                        <Label>
                                            Security Question
                                        </Label>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                            {securityQuestion}
                                        </p>
                                        <Input
                                            type="text"
                                            placeholder="Enter your answer"
                                            value={securityAnswer}
                                            onChange={(e) => setSecurityAnswer(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>
                                            New Password <span className="text-error-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter new password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                            <span
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                                            >
                                                {showPassword ? (
                                                    <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                                                ) : (
                                                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <Label>
                                            Confirm Password <span className="text-error-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Confirm new password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                            />
                                            <span
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                                                ) : (
                                                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            className="flex-1"
                                            size="sm"
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setStep(1);
                                                setSecurityAnswer("");
                                                setNewPassword("");
                                                setConfirmPassword("");
                                                setError("");
                                            }}
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            size="sm"
                                            type="submit"
                                            disabled={isLoading || !securityAnswer || !newPassword || !confirmPassword}
                                        >
                                            {isLoading ? "Resetting..." : "Reset Password"}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* Step 3: Success */}
                        {step === 3 && success && (
                            <div className="text-center">
                                <div className="mb-6">
                                    <svg
                                        className="mx-auto h-16 w-16 text-green-500"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                </div>
                                <Link to="/signin">
                                    <Button className="w-full" size="sm">
                                        Go to Sign In
                                    </Button>
                                </Link>
                            </div>
                        )}

                        <div className="mt-5">
                            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                                Remember your password?{" "}
                                <Link
                                    to="/signin"
                                    className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                                >
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
