// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const data = { email, password };

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log('Login response body:', result);

      if (response.ok && result.success) {
        const role = result.user?.role?.toLowerCase();

        // Save user info in localStorage
        localStorage.setItem("user", JSON.stringify(result.user));
        localStorage.setItem("role", role || "");
        if (role === "student") {
          localStorage.setItem("studentId", result.user.uid);
        } else if (role === "teacher") {
          localStorage.setItem("tId", result.user.uid);
        }

        // Debug log to confirm saved values
        console.log('Saved to localStorage:', {
          studentId: localStorage.getItem('studentId'),
          tId: localStorage.getItem('tId'),
          role: localStorage.getItem('role'),
        });

        // <-- FIXED PATH: navigate to the route that exists in your App.jsx
        if (role === "student") {
          console.log('Navigating to student dashboard');
          navigate("/student-dashboard");          // matches App.jsx
          // If you prefer nested: use navigate('/student-dashboard/dashboard')
        } else if (role === "admin") {
          navigate("/dashboard/home");
        } else if (role === "teacher") {
          navigate("/teacher-dashboard");
        } else {
          setErrorMsg("Unknown user role. Please contact admin.");
        }
      } else {
        setErrorMsg(result.message || "Login failed.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMsg("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = () => setShowPassword((prev) => !prev);

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} autoComplete="on">
        <img src="/Login.PNG" alt="Login Logo" className="login-logo" />

        <div className="form-header">
          <h2>Login</h2>
        </div>

        {errorMsg && <div className="error-message">{errorMsg}</div>}

        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            className="toggle-password"
            onClick={togglePassword}
            style={{ cursor: "pointer" }}
          >
            {showPassword ? "Hide" : "Show"}
          </span>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="forgot-password">
          <a href="#">Change Password</a>
        </div>
      </form>
    </div>
  );
};

export default Login;
