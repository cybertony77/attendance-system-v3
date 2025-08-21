import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getApiBaseUrl } from "../config";
import BackToDashboard from "../components/BackToDashboard";
import Title from '../components/Title';

export default function DeleteStudent() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [error, setError] = useState("");
  const [lastCheckedId, setLastCheckedId] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
  }, [router]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const checkStudent = async () => {
    if (!studentId.trim()) {
      setError("Please enter a student ID");
      return;
    }

    setLoading(true);
    setError("");
    setStudent(null);
    setLastCheckedId(studentId.trim());

    try {
      const token = sessionStorage.getItem("token");
      const apiUrl = `${getApiBaseUrl()}/api/students/${studentId}`;
      console.log("Checking student with URL:", apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (response.ok) {
        const studentData = await response.json();
        console.log("Student data:", studentData);
        setStudent(studentData);
      } else if (response.status === 404) {
        setError("Student with this ID does not exist");
      } else {
        const errorText = await response.text();
        console.log("Error response:", errorText);
        setError("Error checking student. Please try again.");
      }
    } catch (error) {
      console.error("Network error:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = async () => {
    if (!student) return;

    setDeleting(true);
    setError("");

    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`${getApiBaseUrl()}/api/students/${studentId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        setDeleted(true);
        setStudent(null);
        setShowConfirm(false); // Hide the modal after success
      } else {
        setError("Error deleting student. Please try again.");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setStudentId("");
    setStudent(null);
    setError("");
    setDeleted(false);
    setLastCheckedId("");
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
            border-color: #667eea;
            background: white;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }
          .form-input::placeholder {
            color: #adb5bd;
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
          .student-info {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
          }
          .student-info h3 {
            margin: 0 0 12px 0;
            color: #495057;
          }
          .student-info p {
            margin: 4px 0;
            color: #6c757d;
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
        <Title>Delete Student</Title>
        <div className="form-container">
          <form onSubmit={(e) => { e.preventDefault(); checkStudent(); }} className="fetch-form">
            <input
              className="fetch-input"
              type="text"
              value={studentId}
              onChange={(e) => {
                const newValue = e.target.value;
                setStudentId(newValue);
                // Clear student info and error if input changes
                if (newValue.trim() !== lastCheckedId) {
                  setStudent(null);
                  setError("");
                }
              }}
              placeholder="Enter student ID (e.g., 1)"
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

          {student && (
            <div className="student-info">
              <h3>Student Found:</h3>
              <p><strong>Name:</strong> {student.name}</p>
              <p><strong>Age:</strong> {student.age || 'N/A'}</p>
              <p><strong>Grade:</strong> {student.grade}</p>
              <p><strong>School:</strong> {student.school}</p>
              <p><strong>Phone:</strong> {student.phone}</p>
              <p><strong>Parent's Phone:</strong> {student.parents_phone || student.parentsPhone}</p>
              <p><strong>Main Center:</strong> {student.main_center}</p>
              
              <div style={{ marginTop: "20px" }}>
                <p style={{ color: "#dc3545", fontWeight: "bold", marginBottom: "16px" }}>
                  ⚠️ Are you sure you want to delete this student? This action cannot be undone.
                </p>
                <button 
                  className="submit-btn"
                  onClick={() => setShowConfirm(true)}
                  disabled={deleting}
                >
                  🗑️ Yes, Delete Student
                </button>
              </div>
            </div>
          )}
        </div>
        {showConfirm && (
          <div className="confirm-modal">
            <div className="confirm-content">
              <h3>Confirm Delete</h3>
              <p>Are you sure you want to delete student <strong>{student?.name}</strong> (ID: {studentId})?</p>
              <p><strong>This action cannot be undone!</strong></p>
              <div className="confirm-buttons">
                <button
                  onClick={deleteStudent}
                  disabled={deleting}
                  className="confirm-reset-btn"
                >
                  {deleting ? "Deleting..." : "Yes, Delete Student"}
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
        {deleted && (
          <div className="success-message" style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: "4rem", marginBottom: "20px" }}>✅</div>
            <h2 style={{ color: "#28a745", marginBottom: "16px" }}>Student Deleted Successfully!</h2>
            <p style={{ color: "#6c757d", marginBottom: "24px" }}>
              Student ID <strong>{studentId}</strong> has been permanently deleted from the database.
            </p>
            <button 
              className="submit-btn"
              onClick={resetForm}
            >
              Delete Another Student
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 