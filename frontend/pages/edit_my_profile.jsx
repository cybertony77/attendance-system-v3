import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { getApiBaseUrl } from "../config";
import bcrypt from "bcryptjs";
import Title from "../components/Title";

export default function EditMyProfile() {
  const [form, setForm] = useState({ name: "", id: "", phone: "", password: "" });
  const [originalForm, setOriginalForm] = useState(null); // Store original data for comparison
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = sessionStorage.getItem("token");
        if (!token) {
          router.push("/");
          return;
        }
        const res = await axios.get(`${getApiBaseUrl()}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Do not set password from backend, always keep it empty
        const formData = { ...res.data, password: "" };
        setForm(formData);
        setOriginalForm({ ...formData }); // Store original data for comparison
      } catch (err) {
        setError("Failed to fetch profile");
      }
    };
    fetchProfile();
  }, []);

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
      const submitForm = { ...changedFields };
      
      // Handle password separately - only include if it was changed and not empty
      if (changedFields.password && changedFields.password.trim() !== "") {
        // Hash the password before sending
        submitForm.password = await bcrypt.hash(changedFields.password, 10);
      } else if (changedFields.password !== undefined) {
        // If password field was cleared, don't send it
        delete submitForm.password;
      }
      
      await axios.put(`${getApiBaseUrl()}/api/auth/me`, submitForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(true);
      
      // Update original data to reflect the new state
      setOriginalForm({ ...form });
    } catch (err) {
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: 20 }}>
      <div style={{ maxWidth: 600, margin: "40px auto", padding: 24 }}>
        <style jsx>{`
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
            border-color: #667eea;
            background: white;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
            opacity: 0.7;
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
                 <Title>Edit My Profile</Title>
        <div className="form-container">
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
              <label>Name</label>
              <input
                className="form-input"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Username (ID)</label>
              <input
                className="form-input"
                name="id"
                value={form.id}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                className="form-input"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                className="form-input"
                name="password"
                type="text"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="submit-btn" disabled={loading || !hasChanges()}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
          {success && <div className="success-message">Profile updated successfully!</div>}
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>
    </div>
  );
} 