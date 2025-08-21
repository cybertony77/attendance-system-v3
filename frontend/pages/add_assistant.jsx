import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import bcrypt from "bcryptjs";
import { getApiBaseUrl } from "../config";
import Title from "../components/Title";

function decodeJWT(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default function AddAssistant() {
  const router = useRouter();
  const [form, setForm] = useState({ id: "", name: "", phone: "", password: "", role: "assistant" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [newId, setNewId] = useState(""); // Added for success message

  useEffect(() => {
    // Only allow admin
    const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
    if (!token) {
      // Use window.location to avoid router conflicts
      window.location.href = "/";
      return;
    }
    const decoded = token ? decodeJWT(token) : null;
    if (!decoded || decoded.role !== "admin") {
      console.log("🚫 Access denied: User is not admin, redirecting to dashboard");
      // Use window.location to avoid router conflicts
      window.location.href = "/dashboard";
    }
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`${getApiBaseUrl()}/api/auth/assistants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...form })
      });
      if (res.status === 409) {
        setError("Assistant ID already exists.");
      } else if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to add assistant.");
      } else {
        setSuccess(true);
        setForm({ id: "", name: "", phone: "", password: "", role: "assistant" });
        const data = await res.json();
        setNewId(data.assistant_id);
      }
    } catch (err) {
      setError("Failed to add assistant.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQR = () => {
    if (newId) {
      router.push(`/qr_code?id=${newId}`);
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: 600, margin: "40px auto", padding: 24 }}>
        <style jsx>{`
          .title {
            font-size: 2rem;
            font-weight: 700;
            color: #ffffff;
            text-align: center;
            margin-bottom: 32px;
          }
          .form-container {
            background: white;
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.2);
          }
          .form-group {
            margin-bottom: 24px;
          }
          .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #495057;
            font-size: 0.95rem;
          }
          .form-input {
            width: 100%;
            padding: 14px 16px;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            font-size: 1rem;
            transition: all 0.3s ease;
            box-sizing: border-box;
            background: #ffffff;
            color: #000000;
          }
          .form-input:focus {
            outline: none;
            border-color: #87CEEB;
            background: white;
            box-shadow: 0 0 0 3px rgba(135, 206, 235, 0.1);
          }
          .form-input::placeholder {
            color: #adb5bd;
          }
          .submit-btn {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #87CEEB 0%, #B0E0E6 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 16px rgba(135, 206, 235, 0.3);
            margin-top: 8px;
          }
          .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(135, 206, 235, 0.4);
          }
          .success-message {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            border-radius: 10px;
            padding: 16px;
            margin-top: 16px;
            text-align: center;
            font-weight: 600;
            box-shadow: 0 4px 16px rgba(40, 167, 69, 0.3);
          }
          .error-message {
            background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
            color: white;
            border-radius: 10px;
            padding: 16px;
            margin-top: 16px;
            text-align: center;
            font-weight: 600;
            box-shadow: 0 4px 16px rgba(220, 53, 69, 0.3);
          }
        `}</style>
                 <Title backText="Back to Manage Assistants" href="/manage_assistants">Add Assistant</Title>
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>ID *</label>
              <input
                className="form-input"
                name="id"
                placeholder="Enter assistant ID"
                value={form.id}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Name *</label>
              <input
                className="form-input"
                name="name"
                placeholder="Enter assistant's name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input
                className="form-input"
                name="phone"
                placeholder="Enter assistant's phone number"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Password *</label>
              <input
                className="form-input"
                name="password"
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Role *</label>
              <select
                className="form-input"
                name="role"
                value={form.role}
                onChange={handleChange}
                required
              >
                <option value="assistant">assistant</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Adding..." : "Add Assistant"}
            </button>
          </form>
          {success && (
            <div className="success-message">Assistant added successfully!</div>
          )}
          {error && (
            <div className="error-message">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
} 