import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// With OTP authentication, signup and login are the same flow
// Redirect to login page
export default function Signup() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/login", { replace: true });
  }, [navigate]);

  return null;
}
