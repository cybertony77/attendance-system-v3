import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getApiBaseUrl } from "../config";
import Title from "../components/Title";
import ContactDeveloper from "../components/ContactDeveloper";

function decodeJWT(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default function DeleteAssistant() {
  const router = useRouter();
  const [assistantId, setAssistantId] = useState("");
  const [assistant, setAssistant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

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

  const checkAssistant = async () => {
    if (!assistantId.trim()) {
      setError("Please enter an assistant ID");
      return;
    }
    setLoading(true);
    setError("");
    setAssistant(null);
    try {
      const token = sessionStorage.getItem("token");
      const apiUrl = `${getApiBaseUrl()}/api/auth/assistants/${assistantId}`;
      const response = await fetch(apiUrl, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const assistantData = await response.json();
        setAssistant(assistantData);
      } else if (response.status === 404) {
        setError("Assistant with this ID does not exist");
      } else {
        setError("Error checking assistant. Please try again.");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteAssistant = async () => {
    if (!assistant) return;
    setDeleting(true);
    setError("");
    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`${getApiBaseUrl()}/api/auth/assistants/${assistantId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        setDeleted(true);
        setAssistant(null);
        setShowConfirm(false); // Hide the modal after success
      } else {
        setError("Error deleting assistant. Please try again.");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setAssistantId("");
    setAssistant(null);
    setError("");
    setDeleted(false);
  };

  return (
    <div style={{ minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: 600, margin: "40px auto", padding: 24 }}>
                 <Title backText="Back to Manage Assistants" href="/manage_assistants">Delete Assistant</Title>
        <style jsx>{`
          .delete-btn {
            background: linear-gradient(90deg, #87CEEB 0%, #B0E0E6 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s, transform 0.2s;
          }
          .delete-btn:hover {
            background: linear-gradient(90deg, #5F9EA0 0%, #87CEEB 100%);
            transform: translateY(-2px) scale(1.03);
          }
          .danger-btn {
            background: linear-gradient(90deg, #dc3545 0%, #ff6b6b 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s, transform 0.2s;
          }
          .danger-btn:hover {
            background: linear-gradient(90deg, #c82333 0%, #dc3545 100%);
            transform: translateY(-2px) scale(1.03);
          }
          .form-group {
            margin-bottom: 16px;
          }
          .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
          }
          .form-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 1rem;
            box-sizing: border-box;
            background: #ffffff;
            color: #000000;
          }
          .form-group input:focus {
            outline: none;
            border-color: #87CEEB;
          }
          .error {
            color: #dc3545;
            margin-top: 8px;
            font-weight: 500;
          }
          .success {
            color: #28a745;
            margin-top: 8px;
            font-weight: 500;
          }
          .assistant-info {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
          }
          .assistant-info h3 {
            margin: 0 0 12px 0;
            color: #495057;
          }
          .assistant-info p {
            margin: 4px 0;
            color: #6c757d;
          }
          .btn-full {
            width: 100%;
            padding: 14px 0;
            font-size: 1.1rem;
            margin-bottom: 12px;
          }
          .confirm-modal {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          .confirm-content {
            background: #fff;
            border-radius: 12px;
            padding: 32px 24px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15);
            max-width: 400px;
            width: 100%;
            text-align: center;
          }
          .confirm-buttons {
            display: flex;
            gap: 16px;
            margin-top: 24px;
            justify-content: center;
          }
          .confirm-reset-btn {
            background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 24px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.2s;
          }
          .confirm-reset-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
          }
          .cancel-btn {
            background: #adb5bd;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 24px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.2s;
          }
          .success-message {
            background: #d1fae5;
            color: #166534;
            border-radius: 10px;
            padding: 16px;
            margin-top: 16px;
            text-align: center;
            font-weight: 600;
            box-shadow: 0 4px 16px rgba(40, 167, 69, 0.08);
            border: 1.5px solid #6ee7b7;
            font-size: 1.1rem;
          }
          .error-message {
            background: #fee2e2;
            color: #991b1b;
            border-radius: 10px;
            padding: 16px;
            margin-top: 16px;
            text-align: center;
            font-weight: 600;
            box-shadow: 0 4px 16px rgba(220, 53, 69, 0.08);
            border: 1.5px solid #fca5a5;
            font-size: 1.1rem;
          }
          .form-container {
            background: white;
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.2);
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
        `}</style>
        {!deleted ? (
          <>
            <div className="form-container">
              <form onSubmit={(e) => { e.preventDefault(); checkAssistant(); }} className="fetch-form">
              <input
                  className="fetch-input"
                type="text"
                value={assistantId}
                onChange={(e) => setAssistantId(e.target.value)}
                  placeholder="Enter assistant ID (e.g., admin)"
                disabled={loading || deleting}
                  required
              />
                <button 
                  type="submit"
                  className="fetch-btn"
                  disabled={loading || deleting}
                >
                  {loading ? "Loading..." : "🔍 Search"}
                </button>
              </form>
              
            {error && (
              <div className="error-message">{error}</div>
            )}
            </div>
            {assistant && (
              <div className="assistant-info">
                <h3>Assistant Found:</h3>
                <p><strong>ID:</strong> {assistant.id}</p>
                <p><strong>Name:</strong> {assistant.name}</p>
                <p><strong>Phone:</strong> {assistant.phone}</p>
                <p><strong>Role:</strong> {assistant.role}</p>
                <div style={{ marginTop: "20px" }}>
                  {assistant.id === 'admin' ? (
                    <>
                      <p style={{ color: "#dc3545", fontWeight: "bold", marginBottom: "16px" }}>
                        ⚠️ You are deleting yourself (admin). This action cannot be done. Please contact the developer (Tony Joseph) if you insist to delete yourself.
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                        <ContactDeveloper />
                      </div>
                    </>
                  ) : (
                    <>
                      <p style={{ color: "#dc3545", fontWeight: "bold", marginBottom: "16px" }}>
                        ⚠️ Are you sure you want to delete this assistant? This action cannot be undone.
                      </p>
                      <button 
                        className="danger-btn btn-full"
                        onClick={() => setShowConfirm(true)}
                        disabled={deleting}
                      >
                        🗑️ Yes, Delete Assistant
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
            {showConfirm && assistant && assistant.id !== 'admin' && (
              <div className="confirm-modal">
                <div className="confirm-content">
                  <h3>Confirm Delete</h3>
                  <p>Are you sure you want to delete assistant <strong>{assistant?.name}</strong> (ID: {assistantId})?</p>
                  <p><strong>This action cannot be undone!</strong></p>
                  <div className="confirm-buttons">
                    <button
                      onClick={deleteAssistant}
                      disabled={deleting}
                      className="confirm-reset-btn"
                    >
                      {deleting ? "Deleting..." : "Yes, Delete Assistant"}
                    </button>
                    <button
                      onClick={() => setShowConfirm(false)}
                      disabled={deleting}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="success-message">
            <div style={{ fontSize: "4rem", marginBottom: "20px" }}>✅</div>
            <h2 style={{ color: "#28a745", marginBottom: "16px" }}>Assistant Deleted Successfully!</h2>
            <p style={{ color: "#6c757d", marginBottom: "24px" }}>
              Assistant ID <strong>{assistantId}</strong> has been permanently deleted from the database.
            </p>
            <button 
              className="delete-btn btn-full"
              onClick={resetForm}
            >
              Delete Another Assistant
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 