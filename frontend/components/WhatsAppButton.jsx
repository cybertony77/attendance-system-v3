import React, { useState } from 'react';
import axios from 'axios';
import { getApiBaseUrl } from '../config';

const WhatsAppButton = ({ student, onMessageSent }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');


  const sendWhatsAppMessage = async (student) => {
    try {
      console.log('📞 Preparing WhatsApp message for student:', student.name);
      
      // Format the parent phone number (add '2' if not present)
      let parentNumber = student.parents_phone ? student.parents_phone.replace(/[^0-9]/g, '') : null;
      if (parentNumber && !parentNumber.startsWith('2')) {
        parentNumber = '2' + parentNumber;
      }
      
      console.log('📱 Formatted parent number:', parentNumber);
      
      if (!parentNumber) {
        console.error(`❌ No parent number for student: ${student.name} with id: ${student.id}`);
        return { success: false, error: 'No parent number available' };
      }

      console.log('🚀 Sending via backend route...');
      const token = sessionStorage.getItem('token');
      
      // If we have a specific week number, pass it to the API
      const requestBody = student.currentWeekNumber ? { week: student.currentWeekNumber } : {};
      
      const response = await axios.post(`${getApiBaseUrl()}/api/students/${student.id}/send-whatsapp`, requestBody, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Backend WhatsApp response:', response.data);
      console.log(`✅ Message sent to ${student.name} Parent: ${parentNumber}`);
      return { success: true, message: `Message sent to ${student.name}'s parent` };

    } catch (err) {
      console.error(`❌ Error sending to ${student.name} Parent:`, err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error message:', err.message);
      return { success: false, error: err.response ? err.response.data : err.message };
    }
  };

  const handleWhatsAppClick = async () => {
    setLoading(true);
    setMessage('');

    // Validate phone number before sending
    let parentNumber = student.parents_phone ? student.parents_phone.replace(/[^0-9]/g, '') : null;
    if (!parentNumber || parentNumber.length < 10) { // adjust length as needed
      setMessage('Invalid or missing parent phone number');
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      console.log('🔄 Starting WhatsApp message send...');
      const result = await sendWhatsAppMessage(student);
      console.log('📱 WhatsApp API result:', result);
              if (result.success) {
          console.log('✅ WhatsApp message sent successfully!');
          setMessage('Message sent successfully!');
          if (onMessageSent) {
            onMessageSent(student.id, true);
          }
          // Trigger a manual refresh after 1 second to get updated server state
          setTimeout(() => {
            // This will trigger a manual refresh in the parent component
            window.dispatchEvent(new CustomEvent('refreshStudents'));
          }, 1000);
          setTimeout(() => setMessage(''), 3000);
        } else {
        console.error('❌ WhatsApp API failed:', result.error);
        // Show user-friendly error message
        const errorMessage = result.error?.error || 'Error to send message';
        setMessage(errorMessage);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      // Show user-friendly error message
      const errorMessage = error.response?.data?.error || 'Error to send message';
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <button
        onClick={handleWhatsAppClick}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#ccc' : '#25D366',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          padding: '6px 12px',
          fontSize: '12px',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: '500',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#128C7E')}
        onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#25D366')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
        {loading ? 'Sending...' : 'Send'}
      </button>
      
      {message && (
        <div style={{
          fontSize: '10px',
          color: message.includes('success') ? '#28a745' : '#dc3545',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default WhatsAppButton; 