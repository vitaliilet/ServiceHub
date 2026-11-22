import './Register.css'
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Отримуємо CSRF-токен
      const csrfResponse = await fetch("/api/auth/csrf", {
        credentials: "include",
      });

      if (!csrfResponse.ok) {
        throw new Error("Could not get security token");
      }

      const csrf = await csrfResponse.json();

      // Надсилаємо email і пароль
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          [csrf.headerName]: csrf.token,
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid email or password");
      }

      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <h1>Sign In</h1>
      <p>Welcome back to ServiceHub</p>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
<p className="auth-switch">
  Don't have an account? <Link to="/register">Sign Up</Link>
</p>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}

