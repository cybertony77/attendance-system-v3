import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { getApiBaseUrl } from "../config";
import CenterSelect from "../components/CenterSelect";
import BackToDashboard from "../components/BackToDashboard";
import GradeSelect from '../components/GradeSelect';
import Title from '../components/Title';

// Helper to normalize grade values to match select options
function normalizeGrade(grade) {
  if (!grade) return "";
  const g = grade.toLowerCase().replace(/\s+/g, "");
  if (g === "1stsecondary" || g === "1stsec") return "1st Secondary";
  if (g === "2ndsecondary" || g === "2ndsec") return "2nd Secondary";
  if (g === "3rdsecondary" || g === "3rdsec") return "3rd Secondary";
  return "";
}

export default function EditStudent() {
  const containerRef = useRef(null);
  const [studentId, setStudentId] = useState("");
  const [student, setStudent] = useState(null);
  const [originalStudent, setOriginalStudent] = useState(null); // Store original data for comparison
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'grade', 'center', or null
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

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpenDropdown(null);
        // Also blur any focused input to close browser autocomplete
        if (document.activeElement && document.activeElement.tagName === 'INPUT') {
          document.activeElement.blur();
        }
      }
    };

    // Also handle when a dropdown opens to close others
    const handleDropdownOpen = () => {
      // Close any open dropdowns when a new one opens
      if (openDropdown) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('focusin', handleDropdownOpen);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('focusin', handleDropdownOpen);
    };
  }, [openDropdown]);
  const router = useRouter();

  const [center, setCenter] = useState("");
  const [hwDone, setHwDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleIdSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setStudent(null);
    setOriginalStudent(null);
    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }
      const res = await axios.get(
        `${getApiBaseUrl()}/api/students/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const studentData = {
        name: res.data.name,
        grade: normalizeGrade(res.data.grade),
        phone: res.data.phone,
        parents_phone: res.data.parents_phone,
        main_center: res.data.main_center,
        school: res.data.school || "",
        age: res.data.age || ""
      };
      setStudent(studentData);
      setOriginalStudent({ ...studentData }); // Store original data for comparison
    } catch (err) {
      setError("This student does not exist.");
    } finally {
      setLoading(false);
    }
  };

  // Clear student data when ID input is emptied
  const handleIdChange = (e) => {
    const value = e.target.value;
    setStudentId(value);
    if (!value.trim()) {
      setStudent(null);
      setOriginalStudent(null);
      setError("");
      setSuccess(false);
    }
  };

  const handleChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
  };

  // Helper function to get only changed fields
  const getChangedFields = () => {
    if (!student || !originalStudent) return {};
    
    const changes = {};
    Object.keys(student).forEach(key => {
      // Only include fields that have actually changed and are not undefined/null
      if (student[key] !== originalStudent[key] && 
          student[key] !== undefined && 
          student[key] !== null && 
          student[key] !== '') {
        changes[key] = student[key];
      }
    });
    return changes;
  };

  // Helper function to check if any fields have changed
  const hasChanges = () => {
    if (!student || !originalStudent) return false;
    
    return Object.keys(student).some(key => student[key] !== originalStudent[key]);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    
    // Check if there are any changes
    if (!hasChanges()) {
      setError("No changes detected. Please modify at least one field before saving.");
      return;
    }
    
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }
      const changedFields = getChangedFields();
      
      // Debug logging
      console.log('🔍 Original student data:', originalStudent);
      console.log('✏️ Current student data:', student);
      console.log('📤 Fields to be sent:', changedFields);
      
      // Only send changed fields
      const updatedStudent = { ...changedFields };
      
      // Handle special field transformations
      if (changedFields.grade) {
        updatedStudent.grade = changedFields.grade.toLowerCase().replace(/\./g, '');
      }
      if (changedFields.age) {
        updatedStudent.age = Number(changedFields.age);
      }
      
      console.log('🚀 Final payload being sent:', updatedStudent);
      
      await axios.put(
        `${getApiBaseUrl()}/api/students/${studentId}`,
        updatedStudent,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(true);
      
      // Update original data to reflect the new state
      setOriginalStudent({ ...student });
    } catch (err) {
      setError("Failed to edit student.");
    }
  };

  const goBack = () => {
    router.push("/dashboard");
  };

  return (
    <div style={{ 
      minHeight: "100vh",
      padding: "20px"
    }}>
      <div ref={containerRef} style={{ maxWidth: 600, margin: "40px auto", padding: 24 }}>
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
          margin-bottom: 10px;
          font-weight: 600;
          color: #495057;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .form-input {
          width: 100%;
          padding: 16px 18px;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          font-size: 1rem;
          transition: all 0.3s ease;
          box-sizing: border-box;
          background: #ffffff;
          color: #000000;
        }
        .form-input:focus {
          outline: none;
          border-color: #1FA8DC;
          background: white;
          box-shadow: 0 0 0 3px rgba(31, 168, 220, 0.1);
        }
        .form-input::placeholder {
          color: #adb5bd;
        }
        .submit-btn {
          width: 100%;
          padding: 18px;
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(40, 167, 69, 0.3);
          margin-top: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .submit-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(40, 167, 69, 0.4);
          background: linear-gradient(135deg, #1e7e34 0%, #17a2b8 100%);
        }
        .submit-btn:active {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(40, 167, 69, 0.3);
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 2px 8px rgba(40, 167, 69, 0.2);
        }
        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }
        .select-styled {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          font-size: 1rem;
          background: #fff;
          color: #222;
          transition: border-color 0.2s, box-shadow 0.2s;
          margin-top: 4px;
          box-sizing: border-box;
        }
        .select-styled:focus {
          outline: none;
          border-color: #87CEEB;
          box-shadow: 0 0 0 3px rgba(135, 206, 235, 0.1);
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
        @media (max-width: 768px) {
          .form-row {
            grid-template-columns: 1fr;
            gap: 16px;
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
          .form-container {
            padding: 24px;
          }
          .form-group {
            margin-bottom: 20px;
          }
          .form-input, .fetch-input {
            padding: 14px 16px;
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

      <Title>Edit Student</Title>

      <div className="form-container">
        <form onSubmit={handleIdSubmit} className="fetch-form">
          <input
            className="fetch-input"
            type="text"
            placeholder="Enter student ID (e.g., 1)"
            value={studentId}
            onChange={handleIdChange}
            required
          />
          <button type="submit" className="fetch-btn" disabled={loading}>
            {loading ? "Loading..." : "🔍 Search"}
          </button>
        </form>
      </div>
      
      {student && (
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
          
          <form onSubmit={handleEdit}>
            <div className="form-group">
              <label>Full Name <span style={{color: 'red'}}>*</span></label>
              <input
                className="form-input"
                name="name"
                placeholder="Enter student's full name"
                value={student.name}
                onChange={handleChange}
                required
                autocomplete="off"
              />
            </div>
            <div className="form-group">
              <label>Age <span style={{color: 'red'}}>*</span></label>
              <input
                className="form-input"
                name="age"
                type="number"
                min="10"
                max="30"
                placeholder="Enter student's age"
                value={student.age}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Grade <span style={{color: 'red'}}>*</span></label>
                <GradeSelect 
                  selectedGrade={student.grade} 
                  onGradeChange={(grade) => handleChange({ target: { name: 'grade', value: grade } })} 
                  required 
                  isOpen={openDropdown === 'grade'}
                  onToggle={() => setOpenDropdown(openDropdown === 'grade' ? null : 'grade')}
                  onClose={() => setOpenDropdown(null)}
                />
              </div>
              <div className="form-group">
                <label>School <span style={{color: 'red'}}>*</span></label>
                <input
                  className="form-input"
                  name="school"
                  placeholder="Enter student's school"
                  value={student.school}
                  onChange={handleChange}
                  required
                  autocomplete="off"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Student Phone <span style={{color: 'red'}}>*</span></label>
                <input
                  className="form-input"
                  name="phone"
                  placeholder="Enter student's phone number"
                  value={student.phone}
                  onChange={handleChange}
                  required
                  autocomplete="off"
                />
              </div>
              <div className="form-group">
                <label>Parent's Phone <span style={{color: 'red'}}>*</span></label>
                <input
                  className="form-input"
                  name="parents_phone"
                  placeholder="Enter parent's phone number"
                  value={student.parents_phone}
                  onChange={handleChange}
                  required
                  autocomplete="off"
                />
              </div>
            </div>
            <div className="form-group" style={{ width: '100%' }}>
              <label>Main Center <span style={{color: 'red'}}>*</span></label>
              <CenterSelect 
                selectedCenter={student.main_center} 
                onCenterChange={(center) => handleChange({ target: { name: 'main_center', value: center } })} 
                required 
                style={{ width: '100%' }}
                isOpen={openDropdown === 'center'}
                onToggle={() => setOpenDropdown(openDropdown === 'center' ? null : 'center')}
                onClose={() => setOpenDropdown(null)}
              />
            </div>
            <button type="submit" className="submit-btn" disabled={!hasChanges()}>
              ✏️ Update Student
            </button>
          </form>
        </div>
      )}
      
      {success && (
        <div className="success-message">
          ✅ Student updated successfully!
        </div>
      )}
      
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}
      </div>
    </div>
  );
}
