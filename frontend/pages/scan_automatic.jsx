import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from "axios";
import { useRouter } from "next/router";
import { getApiBaseUrl } from "../config";
import { AVAILABLE_CENTERS } from "../constants/centers";
import Title from "../components/Title";
import AttendanceWeekSelect from "../components/AttendanceWeekSelect";
import CenterSelect from "../components/CenterSelect";

// Helper to extract student ID from QR text (URL or plain number)
function extractStudentId(qrText) {
  try {
    // Try to parse as URL and extract id param
    const url = new URL(qrText);
    const id = url.searchParams.get('id');
    if (id) return id;
  } catch (e) {
    // Not a URL, fall through
  }
  // Fallback: if it's just a number
  if (/^\d+$/.test(qrText)) {
    return qrText;
  }
  return null;
}

export default function QR() {
  const containerRef = useRef(null);
  const [token, setToken] = useState("");
  const [studentId, setStudentId] = useState("");
  const [student, setStudent] = useState(null);
  const [error, setError] = useState("");
  const [attendSuccess, setAttendSuccess] = useState(false);
  const [scanner, setScanner] = useState(null);
  const [attendanceCenter, setAttendanceCenter] = useState("");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [hwLoading, setHwLoading] = useState(false);
  const [paidLoading, setPaidLoading] = useState(false);
  const [quizDegreeInput, setQuizDegreeInput] = useState("");
  const [quizDegreeOutOf, setQuizDegreeOutOf] = useState("");
  const [quizDegreeLoading, setQuizDegreeLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null); // 'week', 'center', or null
  const router = useRouter();

  // Load remembered values from sessionStorage
  useEffect(() => {
    const rememberedCenter = sessionStorage.getItem('lastAttendanceCenter');
    const rememberedWeek = sessionStorage.getItem('lastSelectedWeek');
    
    if (rememberedCenter) {
      setAttendanceCenter(rememberedCenter);
    }
    if (rememberedWeek) {
      setSelectedWeek(rememberedWeek);
    }
  }, []);

  useEffect(() => {
    const t = sessionStorage.getItem("token");
    if (!t) {
      router.push("/");
      return;
    }
  }, [router]);

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

    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper function to convert week string to numeric index
  const getWeekNumber = (weekString) => {
    if (!weekString) return null;
    const match = weekString.match(/week (\d+)/);
    const result = match ? parseInt(match[1]) : null;
    console.log('🔧 Converting week string:', { weekString, result });
    return result;
  };

  // Helper function to get current week data
  const getCurrentWeekData = (student, weekString) => {
    if (!student.weeks || !weekString) return null;
    const weekNumber = getWeekNumber(weekString);
    if (!weekNumber) return null;
    const weekIndex = weekNumber - 1;
    return student.weeks[weekIndex] || null;
  };

  // Helper function to update student state with current week data
  const updateStudentWithWeekData = (student, weekString) => {
    const weekData = getCurrentWeekData(student, weekString);
    if (!weekData) return student;
    
    return {
      ...student,
      attended_the_session: weekData.attended,
      lastAttendance: weekData.lastAttendance,
      lastAttendanceCenter: weekData.lastAttendanceCenter,
      hwDone: weekData.hwDone,
      paidSession: weekData.paidSession,
      quizDegree: weekData.quizDegree
    };
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (studentId.trim()) {
      await fetchStudent(studentId.trim());
    }
  };

  const fetchStudent = async (id) => {
    const currentToken = sessionStorage.getItem("token");
    if (!currentToken) {
      setError("Not logged in");
      setStudent(null);
      setAttendSuccess(false);
      return;
    }
    
    setStudentId(id);
    setError("");
    setAttendSuccess(false);
    setStudent(null); // Clear previous student data immediately
    
    try {
      const res = await axios.get(
        `${getApiBaseUrl()}/api/students/${id}`,
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      setStudent(res.data);
      // Keep the remembered values from localStorage
      // They will be loaded by the useEffect above
    } catch (err) {
      setStudent(null);
      setError("Student not found or unauthorized.");
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }
    
  }, [studentId, student]);

  useEffect(() => {
    const qrScanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 300, height: 300 },
        aspectRatio: 1.0
      },
      false
    );

    qrScanner.render((decodedText) => {
      if (decodedText && decodedText !== studentId) {
        // Clear previous student data when new QR is scanned
        setStudent(null);
        setError("");
        setAttendSuccess(false);
        
        // Extract student ID from QR code (URL or number)
        const extractedId = extractStudentId(decodedText);
        if (extractedId) {
          setStudentId(extractedId);
          fetchStudent(extractedId);
        } else {
          setError('Invalid QR code: not a valid student ID');
        }
      }
    }, (errorMessage) => {
      // Clear student data when QR scan fails
      if (errorMessage && typeof errorMessage === 'string') {
        setStudent(null);
        setAttendSuccess(false);
        
        if (errorMessage.includes("NotFoundException")) {
          setError("QR code not readable. Please try again.");
        } else if (errorMessage.includes("No MultiFormat Readers")) {
          setError("QR code not readable. Please try again.");
        } else {
          setError("QR scan error. Please try again.");
        }
      } else if (errorMessage) {
        // Handle non-string error messages
        setStudent(null);
        setAttendSuccess(false);
        setError("QR scan error. Please try again.");
      }
    });

    setScanner(qrScanner);

    return () => {
      if (qrScanner) {
        qrScanner.clear();
      }
    };
  }, [studentId]);

  // Auto-hide error after 6 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError("") , 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const updateAttendanceWeek = async (week) => {
    if (!student) return;
    
    try {
      // Update student data with the selected week's information
      const updatedStudent = updateStudentWithWeekData(student, week);
      setStudent(updatedStudent);
      
      // Remember the selected week
      if (week) {
        sessionStorage.setItem('lastSelectedWeek', week);
      }
    } catch (err) {
      console.error("Failed to update attendance week:", err);
    }
  };

  const markAttended = async () => {
    const currentToken = sessionStorage.getItem("token");
    if (!attendanceCenter) {
      alert("Attendance center is required.");
      return;
    }
    if (!selectedWeek) {
      alert("Attendance week is required.");
      return;
    }
    // Build lastAttendance string
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, '0');
    const lastAttendance = `${day}/${month}/${year} in ${attendanceCenter} at ${formattedHours}:${minutes} ${ampm}`;
    const lastAttendanceCenter = attendanceCenter;
    const weekNumber = getWeekNumber(selectedWeek);
    try {
      await axios.post(
        `${getApiBaseUrl()}/api/students/${studentId}/attend`,
        { lastAttendance, lastAttendanceCenter, attendanceWeek: weekNumber },
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      setAttendSuccess(true);
      // Refresh student data to get updated week information
      const updatedRes = await axios.get(
        `${getApiBaseUrl()}/api/students/${studentId}`,
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      const updatedStudent = updateStudentWithWeekData(updatedRes.data, selectedWeek);
      setStudent(updatedStudent);
      // Don't clear attendanceCenter - keep it for next student
      // Keep selectedWeek so user can correct if wrong week was selected
    } catch (err) {
      setError("Failed to mark attendance: " + (err.response?.data?.error || err.message));
    }
  };

  const toggleHwDone = async () => {
    if (!student) return;
    if (!selectedWeek) {
      setError("Please select a week first.");
      return;
    }
    if (!attendanceCenter) {
      setError("Please select an attendance center first.");
      return;
    }
    setHwLoading(true);
    const currentToken = sessionStorage.getItem("token");
    const weekNumber = getWeekNumber(selectedWeek);
    try {
      await axios.post(
        `${getApiBaseUrl()}/api/students/${student.id}/hw`,
        { hwDone: !student.hwDone, week: weekNumber },
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      // Refresh student data to get updated week information
      const updatedRes = await axios.get(
        `${getApiBaseUrl()}/api/students/${student.id}`,
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      const updatedStudent = updateStudentWithWeekData(updatedRes.data, selectedWeek);
      setStudent(updatedStudent);
    } catch (err) {
      setError("Failed to update H.W status: " + (err.response?.data?.error || err.message));
    } finally {
      setHwLoading(false);
    }
  };

  const togglePaidSession = async () => {
    if (!student) return;
    if (!selectedWeek) {
      setError("Please select a week first.");
      return;
    }
    if (!attendanceCenter) {
      setError("Please select an attendance center first.");
      return;
    }
    setPaidLoading(true);
    const currentToken = sessionStorage.getItem("token");
    const weekNumber = getWeekNumber(selectedWeek);
    console.log('🔧 Toggle paid session:', { selectedWeek, weekNumber, currentPaid: student.paidSession });
    try {
      await axios.post(
        `${getApiBaseUrl()}/api/students/${student.id}/paid`,
        { paidSession: !student.paidSession, week: weekNumber },
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      console.log('✅ Paid session updated successfully');
      // Refresh student data to get updated week information
      const updatedRes = await axios.get(
        `${getApiBaseUrl()}/api/students/${student.id}`,
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      const updatedStudent = updateStudentWithWeekData(updatedRes.data, selectedWeek);
      setStudent(updatedStudent);
    } catch (err) {
      console.error('❌ Error updating paid session:', err);
      setError("Failed to update payment status: " + (err.response?.data?.error || err.message));
    } finally {
      setPaidLoading(false);
    }
  };

  // Add form handler for quiz degree
  const handleQuizFormSubmit = async (e) => {
    e.preventDefault();
    await handleQuizDegreeSubmit();
  };

  // Add handler to save quiz degree
  const handleQuizDegreeSubmit = async () => {
    if (!student) return;
    if (!selectedWeek) {
      setError("Please select a week first.");
      return;
    }
    if (!attendanceCenter) {
      setError("Please select an attendance center first.");
      return;
    }
    if (quizDegreeInput === "" || quizDegreeOutOf === "") return;
    setQuizDegreeLoading(true);
    const currentToken = sessionStorage.getItem("token");
    const quizDegreeValue = `${quizDegreeInput} / ${quizDegreeOutOf}`;
    const weekNumber = getWeekNumber(selectedWeek);
    try {
      await axios.post(
        `${getApiBaseUrl()}/api/students/${student.id}/quiz_degree`,
        { quizDegree: quizDegreeValue, week: weekNumber },
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      // Refresh student data to get updated week information
      const updatedRes = await axios.get(
        `${getApiBaseUrl()}/api/students/${student.id}`,
        { headers: { Authorization: `Bearer ${currentToken}` } }
      );
      const updatedStudent = updateStudentWithWeekData(updatedRes.data, selectedWeek);
      setStudent(updatedStudent);
      setQuizDegreeInput("");
      setQuizDegreeOutOf("");
    } catch (err) {
      setError("Failed to update quiz degree: " + (err.response?.data?.error || err.message));
    } finally {
      setQuizDegreeLoading(false);
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
        .input-section {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          margin-bottom: 24px;
        }
        .input-group {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .manual-input {
          flex: 1;
          padding: 14px 16px;
          border: 2px solid #e9ecef;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: #ffffff;
          color: #000000;
        }
        .manual-input:focus {
          outline: none;
          border-color: #87CEEB;
          background: white;
          box-shadow: 0 0 0 3px rgba(135, 206, 235, 0.1);
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
        .fetch-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 2px 8px rgba(31, 168, 220, 0.2);
        }
        .qr-container {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          margin-bottom: 24px;
        }
        .qr-reader {
          border-radius: 12px;
          overflow: hidden;
          color: #000000;
        }
        .qr-reader * {
          color: #000000 !important;
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
        .student-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .student-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: #495057;
          margin-bottom: 16px;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 12px;
        }
        .student-info {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 30px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          padding: 20px;
          border-radius: 12px;
          border: 2px solid #e9ecef;
          border-left: 4px solid #1FA8DC;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }
        .info-item.select-item {
          border-left: 2px solid #e9ecef;
        }
        .info-label {
          font-weight: 700;
          color: #6c757d;
          font-size: 0.85rem;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .info-value {
          color: #212529;
          font-size: 1.2rem;
          font-weight: 600;
          line-height: 1.4;
        }
        .status-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
        }
        .status-badge {
          padding: 8px 16px;
          border-radius: 25px;
          font-weight: 600;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: fit-content;
          white-space: nowrap;
        }
        .status-attended {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
        }
        .status-not-attended {
          background: linear-gradient(135deg, #dc3545 0%, #e74c3c 100%);
          color: white;
        }
        .mark-attended-btn {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 14px 24px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(40, 167, 69, 0.3);
          width: 100%;
        }
        .mark-attended-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
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
        .mark-hw-btn {
          transition: background 0.2s, color 0.2s;
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
        .quiz-row {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-top: 10px;
          margin-bottom: 16px;
          width: 100%;
        }
        .quiz-input {
          width: 40%;
          min-width: 0;
        }
        .quiz-btn {
          width: 20%;
          min-width: 70px;
          padding-left: 0;
          padding-right: 0;
        }
        .quiz-inputs-container {
          display: flex;
          gap: 8px;
          width: 80%;
        }
        @media (max-width: 600px) {
          .quiz-row {
            flex-direction: column;
            gap: 8px;
          }
          .quiz-input, .quiz-btn {
            width: 100%;
          }
          .quiz-inputs-container {
            display: flex;
            gap: 8px;
            width: 100%;
          }
          .quiz-input {
            width: 50%;
          }
        }
        @media (max-width: 768px) {
          .student-info {
            gap: 12px;
          }
          .status-row {
            flex-direction: column;
            gap: 8px;
          }
          .status-badge {
            justify-content: center;
            width: 100%;
          }
          .info-item {
            padding: 16px;
          }
          .info-value {
            font-size: 1rem;
          }
          .input-group {
            flex-direction: column;
            gap: 12px;
          }
          .fetch-btn {
            width: 100%;
            padding: 14px 20px;
            font-size: 0.95rem;
          }
          .manual-input {
            width: 100%;
          }
        }
        @media (max-width: 480px) {
          .student-info {
            gap: 10px;
          }
          .info-item {
            padding: 14px;
          }
          .info-label {
            font-size: 0.8rem;
          }
          .info-value {
            font-size: 0.95rem;
          }
          .status-badge {
            font-size: 0.8rem;
            padding: 6px 12px;
          }
        }
      `}</style>

             <Title>QR Code Scanner</Title>

      <div className="input-section">
        <form onSubmit={handleManualSubmit} className="input-group">
                  <input
          className="manual-input"
          type="text"
          placeholder="Enter student ID (e.g., 1)"
          value={studentId}
          onChange={(e) => {
            setStudentId(e.target.value);
            // Clear student data when ID changes
            if (e.target.value !== studentId) {
              setStudent(null);
              setError("");
              setAttendSuccess(false);
            }
          }}
        />
          <button type="submit" className="fetch-btn">
            🔍 Search
          </button>
        </form>
      </div>

      <div className="qr-container">
        <div id="qr-reader" className="qr-reader"></div>
      </div>

      {student && (
        <div className="student-card">
          <div className="student-name">{student.name}</div>
                  
          <div className="student-info">
              {student.grade && (
              <div className="info-item">
                <span className="info-label">Grade</span>
                <span className="info-value">{student.grade}</span>
              </div>
              )}
            {student.main_center && (
            <div className="info-item">
              <span className="info-label">Main Center</span>
              <span className="info-value">{student.main_center}</span>
            </div>
            )}
            {student.school && (
            <div className="info-item">
              <span className="info-label">School</span>
              <span className="info-value">{student.school}</span>
            </div>
            )}
          </div>

          <div className="status-row">
            <span className={`status-badge ${student.attended_the_session ? 'status-attended' : 'status-not-attended'}`}>{student.attended_the_session ? '✅ Attended' : '❌ Not Attended'}</span>
            <span className={`status-badge ${student.hwDone ? 'status-attended' : 'status-not-attended'}`}>{student.hwDone ? '✅ H.W: Done' : '❌ H.W: Not Done'}</span>
            <span className={`status-badge ${student.paidSession ? 'status-attended' : 'status-not-attended'}`}>{student.paidSession ? '✅ Paid' : '❌ Not Paid'}</span>
            <span className={`status-badge ${student.quizDegree !== undefined && student.quizDegree !== null && student.quizDegree !== '' ? 'status-attended' : 'status-not-attended'}`}
            >
              {student.quizDegree !== undefined && student.quizDegree !== null && student.quizDegree !== ''
                ? `✅ Quiz: ${student.quizDegree}`
                : '❌ Quiz: ...'}
            </span>
          </div>

          {/* Only show last attendance if student has NOT attended yet */}
          {!student.attended_the_session && student.lastAttendance && (
            <div className="info-item">
              <div className="info-label">Last Attendance:</div>
              <div className="info-value" style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                {student.lastAttendance}
              </div>
            </div>
          )}
          
          {/* Attendance Center - always show for all students */}
          <div className="info-item select-item" style={{ marginBottom: 16 }}>
            <div className="info-label">Attendance Center</div>
            <CenterSelect
              selectedCenter={attendanceCenter}
              onCenterChange={(center) => {
                setAttendanceCenter(center);
                // Remember the selected center
                if (center) {
                  sessionStorage.setItem('lastAttendanceCenter', center);
                }
              }}
            />
          </div>
          
          {/* Attendance Week - always show for both attended and non-attended students */}
          <div className="info-item select-item" style={{ marginBottom: 16 }}>
            <div className="info-label">Attendance Week</div>
            <AttendanceWeekSelect
              selectedWeek={selectedWeek}
              onWeekChange={(week) => {
                console.log('Week selected:', week);
                setSelectedWeek(week);
                if (week) {
                  updateAttendanceWeek(week);
                }
              }}
              required={true}
            />
          </div>

          {/* Warning message when week/center not selected */}
          {(!selectedWeek || !attendanceCenter) && (
            <div style={{
              background: 'linear-gradient(135deg, #ffc107 0%, #ffb74d 100%)',
              color: 'white',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 8,
              textAlign: 'center',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(255, 193, 7, 0.3)',
              fontSize: '0.9rem'
            }}>
              ⚠️ Please select both a week and attendance center to enable tracking
            </div>
          )}

          {/* Button row: always render both buttons in the same order */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            {!student.attended_the_session && (
              <button
                className="mark-attended-btn"
                onClick={markAttended}
                disabled={!attendanceCenter || !selectedWeek}
                style={{
                  opacity: (attendanceCenter && selectedWeek) ? 1 : 0.5,
                  width: '100%',
                  transition: 'all 0.3s ease'
                }}
                title={!selectedWeek ? 'Please select a week first' : !attendanceCenter ? 'Please select an attendance center' : ''}
              >
                ✅ Mark as Attended
            </button>
          )}
            <button
              className="mark-hw-btn"
              style={{
                width: '100%',
                background: student.hwDone ? 'linear-gradient(135deg, #dc3545 0%, #e74c3c 100%)' : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: '1.1rem',
                padding: '14px 0',
                boxShadow: '0 4px 16px rgba(40, 167, 69, 0.3)',
                cursor: (hwLoading || !selectedWeek || !attendanceCenter) ? 'not-allowed' : 'pointer',
                opacity: (hwLoading || !selectedWeek || !attendanceCenter) ? 0.5 : 1,
                transition: 'all 0.3s ease'
              }}
              onClick={toggleHwDone}
              disabled={hwLoading || !selectedWeek || !attendanceCenter}
              title={!selectedWeek ? 'Please select a week first' : !attendanceCenter ? 'Please select an attendance center first' : ''}
            >
              {student.hwDone ? '❌ Mark as Not Done' : '✅ Mark as Done'}
            </button>
            <button
              className="mark-hw-btn"
              style={{
                width: '100%',
                background: student.paidSession ? 'linear-gradient(135deg, #dc3545 0%, #e74c3c 100%)' : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: '1.1rem',
                padding: '14px 0',
                boxShadow: '0 4px 16px rgba(40, 167, 69, 0.3)',
                cursor: (paidLoading || !selectedWeek || !attendanceCenter) ? 'not-allowed' : 'pointer',
                opacity: (paidLoading || !selectedWeek || !attendanceCenter) ? 0.5 : 1,
                marginTop: 0,
                transition: 'all 0.3s ease'
              }}
              onClick={togglePaidSession}
              disabled={paidLoading || !selectedWeek || !attendanceCenter}
              title={!selectedWeek ? 'Please select a week first' : !attendanceCenter ? 'Please select an attendance center first' : ''}
            >
              {student.paidSession ? '❌ Mark as Not Paid' : '✅ Mark as Paid'}
            </button>
            

          </div>

          {/* Quiz degree input section */}
          <div className="info-label" style={{ marginBottom: 6, marginTop: 10, textAlign: 'start', fontWeight: 600 }}>
            Quiz Degree
          </div>
          <form onSubmit={handleQuizFormSubmit} className="quiz-row">
            <div className="quiz-inputs-container">
            <input
              type="number"
              step="any"
              min="0"
              className="manual-input quiz-input"
              placeholder={(!selectedWeek || !attendanceCenter) ? "Select week and center first..." : "degree ..."}
              value={quizDegreeInput}
              onChange={e => setQuizDegreeInput(e.target.value)}
              disabled={quizDegreeLoading || !selectedWeek || !attendanceCenter}
              style={{
                opacity: (!selectedWeek || !attendanceCenter) ? 0.5 : 1,
                cursor: (!selectedWeek || !attendanceCenter) ? 'not-allowed' : 'text'
              }}
            />
            <input
              type="number"
              step="any"
              min="0"
              className="manual-input quiz-input"
              placeholder={(!selectedWeek || !attendanceCenter) ? "Select week and center first..." : "out of ..."}
              value={quizDegreeOutOf}
              onChange={e => setQuizDegreeOutOf(e.target.value)}
              disabled={quizDegreeLoading || !selectedWeek || !attendanceCenter}
              style={{
                opacity: (!selectedWeek || !attendanceCenter) ? 0.5 : 1,
                cursor: (!selectedWeek || !attendanceCenter) ? 'not-allowed' : 'text'
              }}
            />
            </div>
            <button
              type="submit"
              className="fetch-btn quiz-btn"
              disabled={quizDegreeLoading || quizDegreeInput === "" || quizDegreeOutOf === "" || !selectedWeek || !attendanceCenter}
              style={{
                opacity: (!selectedWeek || !attendanceCenter || quizDegreeInput === "" || quizDegreeOutOf === "") ? 0.5 : 1,
                cursor: (!selectedWeek || !attendanceCenter || quizDegreeInput === "" || quizDegreeOutOf === "") ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
              title={!selectedWeek ? 'Please select a week first' : !attendanceCenter ? 'Please select an attendance center first' : (quizDegreeInput === "" || quizDegreeOutOf === "") ? 'Please fill both fields' : ''}
            >
              {quizDegreeLoading ? 'Saving...' : 'Save'}
            </button>
          </form>
        </div>
      )}



      {/* Error message now appears below the student card */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}
      </div>
    </div>
  );
}