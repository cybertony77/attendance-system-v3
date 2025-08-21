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

export default function EditAssistant() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [id, setId] = useState("");
  const [form, setForm] = useState({ id: "", name: "", phone: "", password: "", role: "" });
  const [originalForm, setOriginalForm] = useState(null); // Store original data for comparison
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

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

  const handleIdSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`${getApiBaseUrl()}/api/auth/assistants/${id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        setError("Assistant not found.");
      } else {
        const data = await res.json();
        const formData = { id: data.id, name: data.name, phone: data.phone, password: "", role: data.role || "assistant" };
        setForm(formData);
        setOriginalForm({ ...formData }); // Store original data for comparison
        setStep(2);
      }
    } catch (err) {
      setError("Failed to fetch assistant.");
    } finally {
      setLoading(false);
    }
  };

  // Clear assistant data when ID input is emptied
  const handleIdChange = (e) => {
    const value = e.target.value;
    setId(value);
    if (!value.trim()) {
      const emptyForm = { id: "", name: "", phone: "", password: "", role: "assistant" };
      setForm(emptyForm);
      setOriginalForm(null);
      setStep(1);
      setError("");
      setSuccess(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Helper function to get only changed fields
  const getChangedFields = () => {
    if (!form || !originalForm) return {};
    
    const changes = {};
    Object.keys(form).forEach(key => {
      // Only include fields that have actually changed and are not undefined/null
      if (form[key] !== originalForm[key] && 
          form[key] !== undefined && 
          form[key] !== null && 
          form[key] !== '') {
        changes[key] = form[key];
      }
    });
    return changes;
  };

  // Helper function to check if any fields have changed
  const hasChanges = () => {
    if (!form || !originalForm) return false;
    
    return Object.keys(form).some(key => form[key] !== originalForm[key]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if there are any changes
    if (!hasChanges()) {
      setError("No changes detected. Please modify at least one field before saving.");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const token = sessionStorage.getItem("token");
      const changedFields = getChangedFields();
      
      // Only send changed fields
      let payload = { ...changedFields };
      
      // Handle password separately - only include if it was changed and not empty
      if (changedFields.password && changedFields.password.trim() !== "") {
        // Hash the password before sending
        payload.password = await bcrypt.hash(changedFields.password, 10);
      } else if (changedFields.password !== undefined) {
        // If password field was cleared, don't send it
        delete payload.password;
      }
      
      const res = await fetch(`${getApiBaseUrl()}/api/auth/assistants/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.status === 409) {
        setError("Assistant ID already exists.");
      } else if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update assistant.");
      } else {
        setSuccess(true);
        // Update original data to reflect the new state
        setOriginalForm({ ...form });
      }
    } catch (err) {
      setError("Failed to update assistant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: 600, margin: "40px auto", padding: 24 }}>
        <style jsx>{`
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
          }
          .title {
            font-size: 2rem;
            font-weight: 700;
            color: #ffffff;
          }
          .back-btn {
            background: linear-gradient(90deg, #6c757d 0%, #495057 100%);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px 20px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .back-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
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
          .fetch-form {
            display: flex;
            gap: 12px;
            align-items: center;
            margin-bottom: 24px;
          }
          .fetch-input {
            flex: 1;
            padding: 14px 16px;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            font-size: 1rem;
            transition: all 0.3s ease;
            background: #ffffff;
            color: #000000;
          }
          .fetch-input:focus {
            outline: none;
            border-color: #667eea;
            background: white;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }
          .fetch-btn {
            background: linear-gradient(135deg, #1FA8DC 0%, #87CEEB 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 16px 28px;
            font-weight: 700;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 16px rgba(31, 168, 220, 0.3);
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 140px;
            justify-content: center;
          }
          .fetch-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(31, 168, 220, 0.4);
            background: linear-gradient(135deg, #0d8bc7 0%, #5bb8e6 100%);
          }
          .fetch-btn:active {
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(31, 168, 220, 0.3);
          }
          @media (max-width: 768px) {
            .form-container {
              padding: 24px;
            }
            .form-group {
              margin-bottom: 20px;
            }
            .form-input, .fetch-input {
              padding: 14px 16px;
            }
            .fetch-form {
              flex-direction: column;
              gap: 12px;
            }
            .fetch-btn {
              width: 100%;
              padding: 14px 20px;
              font-size: 0.95rem;
            }
            .fetch-input {
              width: 100%;
            }
          }
          @media (max-width: 480px) {
            .form-container {
              padding: 20px;
            }
            .form-group label {
              font-size: 0.9rem;
            }
            .form-input, .fetch-input {
              padding: 12px 14px;
              font-size: 0.95rem;
            }
            .submit-btn {
              padding: 16px;
              font-size: 1rem;
            }
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
          .submit-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(135, 206, 235, 0.4);
          }
          .submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
            box-shadow: 0 2px 8px rgba(135, 206, 235, 0.2);
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
          .changes-indicator {
            background: linear-gradient(135deg, #17a2b8 0%, #20c997 100%);
            color: white;
            border-radius: 10px;
            padding: 12px 16px;
            margin-bottom: 16px;
            text-align: center;
            font-weight: 600;
            box-shadow: 0 4px 16px rgba(23, 162, 184, 0.3);
          }
          .no-changes {
            background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
            color: white;
            border-radius: 10px;
            padding: 12px 16px;
            margin-bottom: 16px;
            text-align: center;
            font-weight: 600;
            box-shadow: 0 4px 16px rgba(108, 117, 125, 0.3);
          }
        `}</style>
                 <Title backText="Back to Manage Assistants" href="/manage_assistants">Edit Assistant</Title>
        
          <div className="form-container">
          <form onSubmit={handleIdSubmit} className="fetch-form">
                <input
              className="fetch-input"
                  name="id"
                  placeholder="Enter assistant ID"
                  value={id}
              onChange={handleIdChange}
                  required
                />
            <button type="submit" disabled={loading} className="fetch-btn">
              {loading ? "Loading..." : "🔍 Search"}
              </button>
            </form>
          </div>
        
        {step === 2 && (
          <div className="form-container" style={{ marginTop: "20px" }}>
            {/* Show changes indicator */}
            {hasChanges() ? (
              <div className="changes-indicator">
                ✏️ Changes detected - Only modified fields will be sent to server
              </div>
            ) : (
              <div className="no-changes">
                ℹ️ No changes detected - Modify at least one field to enable save
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>ID *</label>
                <input
                  className="form-input"
                  name="id"
                  placeholder="Edit assistant ID"
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
                  placeholder="Edit assistant's name"
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
                  placeholder="Edit assistant's phone number"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password (leave blank to keep current)</label>
                <input
                  className="form-input"
                  name="password"
                  type="password"
                  placeholder="Enter new password"
                  value={form.password}
                  onChange={handleChange}
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
              <button type="submit" disabled={loading || !hasChanges()} className="submit-btn">
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        )}
        {success && <div className="success-message">Assistant updated successfully!</div>}
        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
} 