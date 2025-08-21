import { useState } from 'react';
import { AVAILABLE_CENTERS } from "../constants/centers";

export default function CenterSelect({ selectedCenter, onCenterChange, required = false, isOpen, onToggle, onClose }) {
  // Handle legacy props (value, onChange) for backward compatibility
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const actualIsOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const actualOnToggle = onToggle || (() => setInternalIsOpen(!internalIsOpen));
  const actualOnClose = onClose || (() => setInternalIsOpen(false));

  const handleCenterSelect = (center) => {
    onCenterChange(center);
    actualOnClose();
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          padding: '14px 16px',
          border: actualIsOpen ? '2px solid #1FA8DC' : '2px solid #e9ecef',
          borderRadius: '10px',
          backgroundColor: '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '1rem',
          color: selectedCenter ? '#000000' : '#adb5bd',
          transition: 'all 0.3s ease',
          boxShadow: actualIsOpen ? '0 0 0 3px rgba(31, 168, 220, 0.1)' : 'none'
        }}
        onClick={actualOnToggle}
        onBlur={() => setTimeout(actualOnClose, 200)}
      >
        <span>{selectedCenter || 'Select Center'}</span>
      </div>
      

      
      {actualIsOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#ffffff',
          border: '2px solid #e9ecef',
          borderRadius: '10px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxHeight: '200px',
          overflowY: 'auto',
          marginTop: '4px'
        }}>
          {/* Clear selection option */}
          <div
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              borderBottom: '1px solid #f8f9fa',
              transition: 'background-color 0.2s ease',
              color: '#dc3545',
              fontWeight: '500'
            }}
            onClick={() => handleCenterSelect('')}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#fff5f5'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
          >
            ✕ Clear selection
          </div>
          {AVAILABLE_CENTERS.map((center) => (
            <div
              key={center}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #f8f9fa',
                transition: 'background-color 0.2s ease',
                color: '#000000'
              }}
              onClick={() => handleCenterSelect(center)}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
            >
              {center}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 