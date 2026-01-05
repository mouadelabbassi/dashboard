import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import { useAuth } from "../../context/AuthContext";

const securityQuestions = [
    "What is your best friend's name?",
    "What was the name of your first pet?",
    "What city were you born in?",
    "What is your mother's maiden name?",
    "What was your childhood nickname?",
    "What is your favorite movie? ",
    "What street did you grow up on?"
];

export default function SignUpForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [formData, setFormData] = useState({
        firstName:"",
        lastName:"",
        email:"",
        password:"",
        role:"BUYER",
        storeName:"",
        securityQuestion:securityQuestions[0],
        securityAnswer:""
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isBannedEmail, setIsBannedEmail] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const roles = [
        {
            value:"BUYER",
            label:"Buyer",
        },
        {
            value:"SELLER",
            label:"Seller",
        },
    ];

    const handleChange = (e:React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]:e.target.value
        });
        if (e.target.name === 'email') {
            setIsBannedEmail(false);
        }
    };

    const handleSubmit = async (e:React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsBannedEmail(false);

        if (!isChecked) {
            setError("Please accept the terms and conditions");
            return;
        }

        if (! formData.securityAnswer.trim()) {
            setError("Please provide an answer to the security question");
            return;
        }

        if (formData.role === "SELLER" && !formData.storeName.trim()) {
            setError("Please enter your store/boutique name");
            return;
        }

        setIsLoading(true);

        try {
            const fullName = `${formData.firstName} ${formData.lastName}`;
            await register(
                formData.email,
                formData.password,
                fullName,
                formData.role,
                formData.securityQuestion,
                formData.securityAnswer,
                formData.role === "SELLER" ? formData.storeName :undefined
            );

            if (formData.role === "SELLER") {
                navigate("/seller/dashboard", { replace:true });
            } else {
                navigate("/shop", { replace:true });
            }
        } catch (err:any) {
            const message = err.message || "Registration failed.Please try again.";
            if (message.includes('deactivated') || message.includes('violating') || message.includes('banned')) {
                setIsBannedEmail(true);
                setError(message);
            } else {
                setError(message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
            <div className="w-full max-w-md mx-auto mb-5 sm:pt-10"></div>
            <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
                <div>
                    <div className="mb-5 sm:mb-8">
                        <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                            Create Your Account
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Join us today and start managing your sales
                        </p>
                    </div>
                    <div>
                        <div className="relative py-3 sm:py-5">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
                            </div>
                        </div>

                        {isBannedEmail && error && (
                            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg">
                                <div className="flex items-start">
                                    <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                    </svg>
                                    <div>
                                        <h4 className="text-red-800 dark:text-red-400 font-semibold">Registration Blocked</h4>
                                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && ! isBannedEmail && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div className="sm:col-span-1">
                                        <Label>First Name<span className="text-error-500">*</span></Label>
                                        <Input
                                            type="text"
                                            name="firstName"
                                            placeholder="Enter your first name"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="sm:col-span-1">
                                        <Label>Last Name<span className="text-error-500">*</span></Label>
                                        <Input
                                            type="text"
                                            name="lastName"
                                            placeholder="Enter your last name"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label>Email<span className="text-error-500">*</span></Label>
                                    <Input
                                        type="email"
                                        name="email"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div>
                                    <Label>Password<span className="text-error-500">*</span></Label>
                                    <div className="relative">
                                        <Input
                                            name="password"
                                            placeholder="Enter your password (min 6 characters)"
                                            type={showPassword ? "text" :"password"}
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                        />
                                        <span
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                                        >
                                            {showPassword ?  (
                                                <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                                            ) :(
                                                <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <Label>Select Your Role<span className="text-error-500">*</span></Label>
                                    <div className="grid grid-cols-1 gap-3 mt-2">
                                        {roles.map((role) => (
                                            <label
                                                key={role.value}
                                                className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                                    formData.role === role.value
                                                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                                                        :'border-gray-200 dark:border-gray-700 hover:border-brand-300'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value={role.value}
                                                    checked={formData.role === role.value}
                                                    onChange={handleChange}
                                                    className="mt-1 text-brand-500 focus:ring-brand-500"
                                                />
                                                <div className="ml-3 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-800 dark:text-white">
                                                            {role.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {formData.role === "SELLER" && (
                                    <div className="animate-fadeIn">
                                        <Label>Store/Boutique Name<span className="text-error-500">*</span></Label>
                                        <Input
                                            type="text"
                                            name="storeName"
                                            placeholder="Enter your store name (e.g., My Awesome Shop)"
                                            value={formData.storeName}
                                            onChange={handleChange}
                                            required
                                        />
                                        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                            This name will be displayed to buyers on your products
                                        </p>
                                        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                            <div className="flex items-start">
                                                <svg className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                                    Your seller account will require verification by our admin team before you can add products.This usually takes 1-2 business days.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <Label>Security Question<span className="text-error-500">*</span></Label>
                                    <select
                                        name="securityQuestion"
                                        value={formData.securityQuestion}
                                        onChange={handleChange}
                                        className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:outline-hidden focus:ring-3 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                                        required
                                    >
                                        {securityQuestions.map((question, index) => (
                                            <option key={index} value={question}>
                                                {question}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                                        This will help you recover your password if you forget it
                                    </p>
                                </div>

                                <div>
                                    <Label>Your Answer<span className="text-error-500">*</span></Label>
                                    <Input
                                        type="text"
                                        name="securityAnswer"
                                        placeholder="Enter your answer"
                                        value={formData.securityAnswer}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        className="w-5 h-5"
                                        checked={isChecked}
                                        onChange={setIsChecked}
                                    />
                                    <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                                        I agree to the{" "}
                                        <span className="text-gray-800 dark:text-white/90">
                                            Terms and Conditions
                                        </span>
                                        {" "}and{" "}
                                        <span className="text-gray-800 dark:text-white">
                                            Privacy Policy
                                        </span>
                                    </p>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={isLoading || isBannedEmail}
                                        className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? "Creating account..." :"Create Account"}
                                    </button>
                                </div>
                            </div>
                        </form>

                        <div className="mt-5">
                            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                                Already have an account?{" "}
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