import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getApiBaseUrl } from "../config";
import Title from '../components/Title';

export default function ResetData() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetType, setResetType] = useState(""); // "specific" or "all"
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [lastCheckedId, setLastCheckedId] = useState("");

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

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleStudentFormSubmit = async (e) => {
    e.preventDefault();
    if (studentId.trim()) {
      await checkStudent();
    }
  };

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
      
      const response = await fetch(apiUrl, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        const studentData = await response.json();
        setStudent(studentData);
      } else if (response.status === 404) {
        setError("Student with this ID does not exist");
      } else {
        setError("Error checking student. Please try again.");
      }
    } catch (error) {
      console.error("Network error:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetSpecificStudent = async () => {
    if (!student) return;

    setResetting(true);
    setError("");

    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`${getApiBaseUrl()}/api/students/${studentId}/reset`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        setSuccess("Student data has been reset successfully!");
        setStudent(null);
        setStudentId("");
        setShowConfirm(false);
      } else {
        setError("Error resetting student data. Please try again.");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setResetting(false);
    }
  };

  const resetAllStudents = async () => {
    setResetting(true);
    setError("");

    try {
      const token = sessionStorage.getItem("token");
      const response = await fetch(`${getApiBaseUrl()}/api/students/reset-all`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        setSuccess("All students data has been reset successfully!");
        setShowConfirm(false);
      } else {
        setError("Error resetting all students data. Please try again.");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setResetting(false);
    }
  };

  const handleResetType = (type) => {
    setResetType(type);
    setStudent(null);
    setStudentId("");
    setError("");
    setSuccess("");
    setShowConfirm(false);
  };

  const handleConfirm = () => {
    setShowConfirm(true);
  };

  const resetForm = () => {
    setStudentId("");
    setStudent(null);
    setError("");
    setSuccess("");
    setShowConfirm(false);
    setResetType("");
  };

  return (
    <div className="container">
      <Title>Reset Data</Title>
      
      <div className="reset-options">
        <button
          className={`reset-btn ${resetType === 'specific' ? 'active' : ''}`}
          onClick={() => handleResetType('specific')}
        >
          🔄 Reset Specific Student
        </button>
        <button
          className={`reset-btn ${resetType === 'all' ? 'active' : ''}`}
          onClick={() => handleResetType('all')}
        >
          🗑️ Reset All Students
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {resetType === 'specific' && (
        <div className="reset-specific">
          <form onSubmit={handleStudentFormSubmit} className="form-group">
            <label>Student ID:</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => {
                const newValue = e.target.value;
                setStudentId(newValue);
                // Clear student info if input is emptied
                if (!newValue.trim()) {
                  setStudent(null);
                }
              }}
              placeholder="Enter student ID"
              className="form-input"
            />
            <button
              type="submit"
              disabled={loading || !studentId.trim()}
              className="check-btn"
            >
              {loading ? "Checking..." : "Check Student"}
            </button>
          </form>

          {student && (
            <div className="student-info">
              <h3>Student Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <strong>Name:</strong> {student.name}
                </div>
                <div className="info-item">
                  <strong>Age:</strong> {student.age}
                </div>
                <div className="info-item">
                  <strong>Grade:</strong> {student.grade}
                </div>
                <div className="info-item">
                  <strong>School:</strong> {student.school}
                </div>
                <div className="info-item">
                  <strong>Phone:</strong> {student.phone}
                </div>
                <div className="info-item">
                  <strong>Parent's Phone:</strong> {student.parents_phone}
                </div>
                <div className="info-item">
                  <strong>Main Center:</strong> {student.main_center}
                </div>
                <div className="info-item">
                  <strong>Attended:</strong> {student.attended_the_session ? "Yes" : "No"}
                </div>
                <div className="info-item">
                  <strong>Last Attendance:</strong> {student.lastAttendance || "None"}
                </div>
                <div className="info-item">
                  <strong>Attendance Week:</strong> {student.attendanceWeek || "None"}
                </div>
                <div className="info-item">
                  <strong>HW Done:</strong> {student.hwDone ? "Yes" : "No"}
                </div>
                <div className="info-item">
                  <strong>Paid Session:</strong> {student.paidSession ? "Yes" : "No"}
                </div>
                <div className="info-item">
                  <strong>Quiz Degree:</strong> {student.quizDegree || "None"}
                </div>
                <div className="info-item">
                  <strong>Message State:</strong> {student.message_state ? "Sent" : "Not Sent"}
                </div>
              </div>
              
              <div className="action-buttons">
                <button
                  onClick={handleConfirm}
                  className="confirm-btn"
                >
                  Confirm Reset this student
                </button>
                <button
                  onClick={resetForm}
                  className="reset-form-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {resetType === 'all' && (
        <div className="reset-all">
          <div className="warning-message">
            <h3>⚠️ Warning</h3>
            <p>This action will reset all variable data for ALL students in the system.</p>
            <p><strong>Data that will be reset:</strong></p>
            <ul>
              <li>Attendance status</li>
              <li>Last attendance date and center</li>
              <li>Attendance week</li>
              <li>Homework status</li>
              <li>Payment status</li>
              <li>Quiz degree</li>
              <li>Message state</li>
            </ul>
            <p><strong>Note:</strong> This will NOT affect the history collection.</p>
          </div>
          
          <div className="action-buttons">
            <button
              onClick={handleConfirm}
              className="confirm-btn"
            >
              Confirm Reset All Students
            </button>
            <button
              onClick={() => handleResetType('')}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="confirm-modal">
          <div className="confirm-content">
            <h3>Confirm Reset</h3>
            <p>
              {resetType === 'specific' 
                ? `Are you sure you want to reset all variable data for student ${student?.name} (ID: ${studentId})?`
                : "Are you sure you want to reset all variable data for ALL students?"
              }
            </p>
            <p><strong>This action cannot be undone!</strong></p>
            
            <div className="confirm-buttons">
              <button
                onClick={resetType === 'specific' ? resetSpecificStudent : resetAllStudents}
                disabled={resetting}
                className="confirm-reset-btn"
              >
                {resetting ? "Resetting..." : "Yes, Reset Data"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={resetting}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 10px;
          min-height: 480px;
        }

        .reset-options {
          display: flex;
          flex-direction: column;
          margin-bottom: 15px;
          align-items: stretch;
        }

        .reset-btn {
          width: 100%;
          margin-bottom: 16px;
          padding: 16px 0;
          background: linear-gradient(135deg, #1FA8DC 0%, #87CEEB 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: 1px;
          box-shadow: 0 4px 16px rgba(31, 168, 220, 0.3);
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .reset-btn:hover {
          background: linear-gradient(135deg, #0d8bc7 0%, #5bb8e6 100%);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(31, 168, 220, 0.4);
        }
        .reset-btn:active {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(31, 168, 220, 0.3);
        }
        .reset-btn.active {
          background: linear-gradient(135deg, #0d8bc7 0%, #5bb8e6 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(31, 168, 220, 0.5);
        }

        .reset-option-btn {
          flex: 1;
          padding: 15px 20px;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          background: white;
          color: #333;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .reset-option-btn:hover {
          border-color: #1FA8DC;
          background: #f8f9fa;
        }

        .reset-option-btn.active {
          border-color: #1FA8DC;
          background: #1FA8DC;
          color: white;
        }

        .reset-specific, .reset-all {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          font-size: 16px;
          margin-bottom: 10px;
        }

        .form-input:focus {
          outline: none;
          border-color: #1FA8DC;
        }

        .check-btn {
          width: 100%;
          padding: 12px 20px;
          background: #1FA8DC;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .check-btn:hover:not(:disabled) {
          background: #0d8bc7;
        }

        .check-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .student-info {
          margin-top: 20px;
        }

        .student-info h3 {
          margin-bottom: 15px;
          color: #333;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 10px;
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 20px;
        }

        .info-item {
          padding: 10px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .info-item strong {
          color: #333;
        }

        .warning-message {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .warning-message h3 {
          color: #856404;
          margin-bottom: 15px;
        }

        .warning-message ul {
          margin: 10px 0;
          padding-left: 20px;
        }

        .warning-message li {
          margin-bottom: 5px;
          color: #856404;
        }
        
        @media (max-width: 768px) {
          .reset-options {
            flex-direction: column;
            gap: 1px;
          }
          .reset-btn {
            padding: 16px 0;
            font-size: 1.1rem;
            margin-bottom: 20px;
          }
          .info-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .form-input {
            padding: 10px 14px;
            font-size: 0.95rem;
          }
          .check-btn {
            padding: 15px 16px;
            font-size: 0.95rem;
          }
        }
        
        @media (max-width: 480px) {
          .reset-btn {
            padding: 10px 0;
            font-size: 1rem;
            margin-bottom: 15px;
          }
          .reset-btn:nth-child(1) {
            margin-top: 10px;
          }
          .form-input {
            padding: 10px 12px;
            font-size: 0.9rem;
          }
          .check-btn {
            padding: 12px;
            font-size: 0.9rem;
          }
          .info-item {
            padding: 8px;
          }
          .container {
            margin-top: 50px;
            min-height: 740px;
            padding: 30px;
          }
        }

        .action-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
        }

        .confirm-btn {
          padding: 12px 24px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .confirm-btn:hover {
          background: #c82333;
        }

        .reset-form-btn, .cancel-btn {
          padding: 12px 24px;
          background: #6c757d;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .reset-form-btn:hover, .cancel-btn:hover {
          background: #5a6268;
        }

        @media (max-width: 768px) {
          .confirm-btn, .reset-form-btn, .cancel-btn {
            padding: 14px 20px;
            font-size: 15px;
          }
          .check-btn {
            padding: 14px 20px;
            font-size: 16px;
          }
        }

        .confirm-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .confirm-content {
          background: white;
          border-radius: 10px;
          padding: 30px;
          max-width: 500px;
          width: 90%;
          text-align: center;
        }

        .confirm-content h3 {
          color: #dc3545;
          margin-bottom: 15px;
        }

        .confirm-content p {
          margin-bottom: 15px;
          color: #333;
        }

        .confirm-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 20px;
        }

        .confirm-reset-btn {
          padding: 12px 24px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .confirm-reset-btn:hover:not(:disabled) {
          background: #c82333;
        }

        .confirm-reset-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 20px;
          border: 1px solid #f5c6cb;
        }

        .success-message {
          background: #d4edda;
          color: #155724;
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 20px;
          border: 1px solid #c3e6cb;
        }
      `}</style>
    </div>
  );
} 