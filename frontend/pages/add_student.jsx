import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import { getApiBaseUrl } from "../config";
import BackToDashboard from "../components/BackToDashboard";
import CenterSelect from "../components/CenterSelect";
import GradeSelect from '../components/GradeSelect';
import Title from '../components/Title';


export default function AddStudent() {
  const containerRef = useRef(null);
  const [form, setForm] = useState({
    name: "",
    age: "",
    grade: "",
    school: "",
    phone: "",
    parentsPhone: "",
    main_center: "",
  });
  const [success, setSuccess] = useState(false);
  const [newId, setNewId] = useState("");
  const [showQRButton, setShowQRButton] = useState(false);
  const [error, setError] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null); // 'grade', 'center', or null
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Remove the success timer - success message should stay visible
  // useEffect(() => {
  //   if (success) {
  //     const timer = setTimeout(() => setSuccess(false), 5000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [success]);

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
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    // Reset QR button if user starts entering new data (when form was previously empty)
    if (showQRButton && !form.name && !form.age && !form.grade && !form.school && !form.phone && !form.parentsPhone && !form.main_center) {
      setShowQRButton(false);
      setNewId("");
    }
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    // Don't reset newId and showQRButton here - only reset on successful submission
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        router.push("/");
        return;
      }
      // Map parentsPhone to parents_phone for backend
      const payload = { ...form, parents_phone: form.parentsPhone };
      payload.age = Number(payload.age);
      let gradeClean = payload.grade.toLowerCase().replace(/\./g, '');
      payload.grade = gradeClean;
      delete payload.parentsPhone;
      const res = await axios.post(
        `${getApiBaseUrl()}/api/students`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(true);
      setNewId(res.data.id);
      setShowQRButton(true); // Show QR button after successful submission
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleCreateQR = () => {
    if (newId) {
      router.push(`/qr_generator?mode=single&id=${newId}`);
    }
  };

  const handleAddAnotherStudent = () => {
    setForm({
      name: "",
      age: "",
      grade: "",
      school: "",
      phone: "",
      parentsPhone: "",
      main_center: "",
    });
    setSuccess(false);
    setNewId("");
    setShowQRButton(false);
    setError("");
  };

  const goBack = () => {
    router.push("/dashboard");
  };

  return (
    <div style={{ minHeight: "100vh", padding: "20px" }}>
      <div ref={containerRef} style={{ maxWidth: 600, margin: "40px auto", padding: 24 }}>
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
        <Title>Add Student</Title>
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name <span style={{color: 'red'}}>*</span></label>
              <input
                className="form-input"
                name="name"
                placeholder="Enter student's full name"
                value={form.name}
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
                value={form.age}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Grade <span style={{color: 'red'}}>*</span></label>
              <GradeSelect 
                selectedGrade={form.grade} 
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
                value={form.school}
                onChange={handleChange}
                required
                autocomplete="off"
              />
            </div>
            <div className="form-group">
              <label>Phone <span style={{color: 'red'}}>*</span></label>
              <input
                className="form-input"
                name="phone"
                placeholder="Enter student's phone number"
                value={form.phone}
                onChange={handleChange}
                required
                autocomplete="off"
              />
            </div>
            <div className="form-group">
              <label>Parent's Phone <span style={{color: 'red'}}>*</span></label>
              <input
                className="form-input"
                name="parentsPhone"
                placeholder="Enter parent's phone number"
                value={form.parentsPhone}
                onChange={handleChange}
                required
                autocomplete="off"
              />
            </div>
            <div className="form-group">
              <label>Main Center <span style={{color: 'red'}}>*</span></label>
              <CenterSelect 
                selectedCenter={form.main_center} 
                onCenterChange={(center) => handleChange({ target: { name: 'main_center', value: center } })} 
                required 
                isOpen={openDropdown === 'center'}
                onToggle={() => setOpenDropdown(openDropdown === 'center' ? null : 'center')}
                onClose={() => setOpenDropdown(null)}
              />
            </div>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? "Adding..." : "Add Student"}
            </button>
          </form>
        </div>
        
        {/* Success message and buttons outside form container */}
        {success && (
          <div>
            <div className="success-message">Student added successfully! ID: {newId}</div>
            {showQRButton && (
              <div style={{ marginTop: 12 }}>
                <button className="submit-btn" onClick={handleCreateQR}>
                  ➡️ Create QR Code for this ID
                </button>
              </div>
            )}
            <div style={{ marginTop: 12 }}>
              <button 
                className="submit-btn" 
                onClick={handleAddAnotherStudent}
                style={{
                  background: 'linear-gradient(135deg, #17a2b8 0%, #20c997 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: '1rem',
                  padding: '14px 20px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(23, 162, 184, 0.3)',
                  width: '100%'
                }}
              >
                ➕ Add Another Student
              </button>
            </div>
          </div>
        )}
        
        {/* Error message outside form container */}
        {error && (
          <div className="error-message">{error}</div>
        )}
      </div>
    </div>
  );
} 