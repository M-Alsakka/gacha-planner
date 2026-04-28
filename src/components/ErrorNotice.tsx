import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import "../styles/error-notice.css";

type ErrorNoticeProps = {
  message: string;
  isUnauthorized?: boolean;
  className?: string;
};

export function ErrorNotice({
  message,
  isUnauthorized = false,
  className = "",
}: ErrorNoticeProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const returnToLogin = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className={`error-notice ${className}`.trim()}>
      <span>{message}</span>
      {isUnauthorized ? (
        <button
          type="button"
          className="error-notice__button"
          onClick={() => {
            void returnToLogin();
          }}
        >
          Return to Login
        </button>
      ) : null}
    </div>
  );
}
