import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";

export default function ForgotPassword() {
    return (
        <>
            <PageMeta
                title="Forgot Password - Reset Your Password"
                description="Reset your password using your security question"
            />
            <AuthLayout>
                <ForgotPasswordForm />
            </AuthLayout>
        </>
    );
}
