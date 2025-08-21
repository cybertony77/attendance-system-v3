import { useState, useEffect, useRef } from "react";
import { QRCode } from "react-qrcode-logo";
import JSZip from "jszip";
import { useRouter } from "next/router";
import html2canvas from "html2canvas";
import Title from "../components/Title";

export default function QRGenerator() {
  const router = useRouter();
  const [mode, setMode] = useState("");
  const [singleId, setSingleId] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [manyFrom, setManyFrom] = useState("");
  const [manyTo, setManyTo] = useState("");
  const [zipUrl, setZipUrl] = useState("");
  const [manyGenerating, setManyGenerating] = useState(false);
  const [qrIds, setQrIds] = useState([]);
  const [qrSize, setQrSize] = useState(350);
  const [logoSize, setLogoSize] = useState(85);

  const inputRef = useRef(null);

  // Handle responsive QR code sizing
  useEffect(() => {
    const updateQRSizes = () => {
      if (window.innerWidth <= 480) {
        setQrSize(250);
        setLogoSize(60);
      } else if (window.innerWidth <= 768) {
        setQrSize(300);
        setLogoSize(70);
      } else {
        setQrSize(350);
        setLogoSize(85);
      }
    };

    updateQRSizes();
    window.addEventListener('resize', updateQRSizes);
    
    return () => window.removeEventListener('resize', updateQRSizes);
  }, []);

  useEffect(() => {
    if (router.isReady) {
      const { mode, id } = router.query;
      if (mode === "single") {
        setMode("single");
        if (id) {
          setSingleId(id);
          setShowQR(false);
          setTimeout(() => {
            if (inputRef.current) inputRef.current.focus();
          }, 100);
        }
      }
    }
  }, [router.isReady, router.query]);

  // Single QR download
  const downloadSingleQR = async () => {
    try {
      const container = document.querySelector('.qr-container');
      if (!container) {
        alert("QR code not found. Please generate a QR code first.");
        return;
      }
      // Use html2canvas to capture the container
      const canvas = await html2canvas(container, {
        backgroundColor: null, // preserve transparency if any
        useCORS: true
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `StudentID_${singleId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("Download failed. Please try again.");
    }
  };

  // Many QR download
  const generateManyQRCodes = async () => {
    try {
      setManyGenerating(true);
      setZipUrl("");
      const zip = new JSZip();
      const from = parseInt(manyFrom, 10);
      const to = parseInt(manyTo, 10);
      const ids = [];
      for (let i = from; i <= to; i++) ids.push(i);
      setQrIds(ids);
      
      // Wait for QR codes to render
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const containers = document.querySelectorAll('.hidden-qr .qr-container');
      if (containers.length === 0) {
        alert("No QR codes found. Please try again.");
        setManyGenerating(false);
        return;
      }
      
      const qrElements = [];
      containers.forEach(container => {
        const element = container.querySelector('canvas, svg');
        if (element) qrElements.push(element);
      });
      
      if (qrElements.length === 0) {
        alert("No QR code elements found. Please try again.");
        setManyGenerating(false);
        return;
      }
      
      for (let i = 0; i < ids.length; i++) {
        const element = qrElements[i];
        if (!element) continue;
        
        try {
          // Check if it's canvas or SVG
          if (element.tagName.toLowerCase() === 'canvas') {
            const container = element.closest('.qr-container');
            if (container) {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              const scale = 7;
              const containerRect = container.getBoundingClientRect();
              const idText = `Your ID: ${ids[i]}`;
              const idFontSize = 32;
              const idMargin = 30;
              const extraHeight = idFontSize + idMargin;
              canvas.width = containerRect.width * scale;
              canvas.height = (containerRect.height + extraHeight) * scale;
              ctx.scale(scale, scale);
              const gradient = ctx.createLinearGradient(0, 0, 0, containerRect.height + extraHeight);
              gradient.addColorStop(0, '#1FA8DC');
              gradient.addColorStop(1, '#FEB954');
              const radius = 25;
              ctx.fillStyle = gradient;
              ctx.beginPath();
              ctx.moveTo(radius, 0);
              ctx.lineTo(containerRect.width - radius, 0);
              ctx.quadraticCurveTo(containerRect.width, 0, containerRect.width, radius);
              ctx.lineTo(containerRect.width, containerRect.height + extraHeight - radius);
              ctx.quadraticCurveTo(containerRect.width, containerRect.height + extraHeight, containerRect.width - radius, containerRect.height + extraHeight);
              ctx.lineTo(radius, containerRect.height + extraHeight);
              ctx.quadraticCurveTo(0, containerRect.height + extraHeight, 0, containerRect.height + extraHeight - radius);
              ctx.lineTo(0, radius);
              ctx.quadraticCurveTo(0, 0, radius, 0);
              ctx.closePath();
              ctx.fill();
              const qrSize = 350;
              const qrX = (containerRect.width - qrSize) / 2;
              const qrY = (containerRect.height - qrSize) / 2;
              const qrCanvas = element;
              ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
              ctx.font = `${idFontSize}px Arial`;
              ctx.fillStyle = '#222';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'top';
              ctx.fillText(idText, containerRect.width / 2, containerRect.height + idMargin / 2);
              const dataUrl = canvas.toDataURL("image/png");
              zip.file(`StudentID_${ids[i]}.png`, dataUrl.split(",")[1], { base64: true });
            } else {
              const dataUrl = element.toDataURL("image/png");
              zip.file(`StudentID_${ids[i]}.png`, dataUrl.split(",")[1], { base64: true });
            }
          } else {
            // SVG handling (existing code)
            const svgClone = element.cloneNode(true);
            const styleElements = svgClone.querySelectorAll('style');
            styleElements.forEach(style => style.remove());
            
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(svgClone);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new window.Image();
            
            canvas.width = 350;
            canvas.height = 350;
            
            const svg64 = btoa(unescape(encodeURIComponent(svgString)));
            const image64 = "data:image/svg+xml;base64," + svg64;
            
            await new Promise((resolve, reject) => {
              img.onload = function () {
                try {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                const dataUrl = canvas.toDataURL("image/png");
              zip.file(`StudentID_${ids[i]}.png`, dataUrl.split(",")[1], { base64: true });
                  resolve();
                } catch (error) {
                  console.error(`Error processing QR code ${ids[i]}:`, error);
                  reject(error);
                }
              };
              img.onerror = function() {
                reject(new Error(`Failed to load QR code ${ids[i]}`));
              };
              img.src = image64;
            });
          }
        } catch (error) {
          console.error(`Error with QR code ${ids[i]}:`, error);
        }
      }
      
      const blob = await zip.generateAsync({ type: "blob" });
      setZipUrl(URL.createObjectURL(blob));
      setManyGenerating(false);
      setQrIds([]); // clear after done
    } catch (error) {
      console.error("Batch generation error:", error);
      alert("Error generating QR codes. Please try again.");
      setManyGenerating(false);
      setQrIds([]);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh",
      padding: "20px"
    }}>
      <div style={{ maxWidth: 600, margin: "40px auto", padding: 24 }}>
      <style jsx>{`
        .qr-btn {
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
        .qr-btn:hover {
          background: linear-gradient(135deg, #0d8bc7 0%, #5bb8e6 100%);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(31, 168, 220, 0.4);
        }
        .qr-btn:active {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(31, 168, 220, 0.3);
        }
        .qr-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 2px 8px rgba(31, 168, 220, 0.2);
        }
        .qr-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 24px;
        }
        .qr-form label {
          font-weight: 600;
          color: #495057;
          font-size: 0.95rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .hidden-qr {
          position: absolute;
          left: -9999px;
          top: -9999px;
          visibility: hidden;
        }
        .qr-container {
          border-radius: 25px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: white;
          padding: 24px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
          margin: 0 auto;
          text-align: center;
          width: fit-content;
        }
        .qr-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin-top: 24px;
          width: 100%;
        }
        .qr-id-text {
          margin-top: 16px;
          font-weight: 700;
          font-size: 1.4rem;
          color: #222;
          letter-spacing: 1px;
          text-align: center;
        }
        .download-btn {
          width: 200px;
          margin: 20px auto 0 auto;
          padding: 14px 24px;
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(40, 167, 69, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
        }
        .download-btn:hover {
          background: linear-gradient(135deg, #1e7e34 0%, #17a2b8 100%);
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(40, 167, 69, 0.4);
          text-decoration: none;
          color: white;
        }
        .download-btn:active {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(40, 167, 69, 0.3);
        }
        input {
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
        input:focus {
          outline: none;
          border-color: #1FA8DC;
          background: white;
          box-shadow: 0 0 0 3px rgba(31, 168, 220, 0.1);
        }
        input::placeholder {
          color: #adb5bd;
        }
        .range-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 768px) {
          .qr-container {
            padding: 20px;
            margin: 0 auto;
          }
          .qr-btn {
            padding: 14px 0;
            font-size: 1rem;
          }
          .download-btn {
            width: 100%;
            max-width: 250px;
          }
          .range-inputs {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          .qr-id-text {
            font-size: 1.2rem;
          }
        }
        @media (max-width: 480px) {
          .qr-container {
            padding: 16px;
          }
          .qr-btn {
            padding: 12px 0;
            font-size: 0.95rem;
          }
          input {
            padding: 14px 16px;
            font-size: 0.95rem;
          }
          .qr-id-text {
            font-size: 1.1rem;
          }
        }
      `}</style>
             <Title>QR Code Generator</Title>
      <button className="qr-btn" onClick={() => setMode("single")}>Single QR Code Generator</button>
      <button className="qr-btn" onClick={() => setMode("many")}>Many QR Codes Generator</button>
      {mode === "single" && (
        <div className="qr-form">
          <label>Enter Student ID (QR Content):</label>
          <input
            type="text"
            value={singleId}
            onChange={e => { setSingleId(e.target.value); setShowQR(false); }}
            placeholder="e.g., 1"
            ref={inputRef}
            onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                setShowQR(true);
              }
            }}
          />
          <button className="qr-btn" onClick={e => { e.preventDefault(); setShowQR(true); }}>Generate QR</button>
          {showQR && singleId && (
            <div className="qr-display">
              <div className="qr-container">
                <QRCode
                  id="single-qr-svg"
                  value={`https://topphysics.org/?id=${singleId}`}
                  size={qrSize}
                  ecLevel="H"
                  logoImage="/logo.png"
                  logoWidth={logoSize}
                  logoHeight={logoSize}
                  logoPadding={3}
                  logoPaddingStyle="square"
                  logoBackgroundColor="white"
                  logoBackgroundTransparent={false}
                  removeQrCodeBehindLogo={true}
                  logoPosition="center"
                />
                <div className="qr-id-text">{`Your ID: ${singleId}`}</div>
              </div>
              <button className="download-btn" onClick={downloadSingleQR}>
                📥 Download QR
              </button>
            </div>
          )}
        </div>
      )}
      {mode === "many" && (
        <div className="qr-form">
          <label>Enter Range (From - To):</label>
          <div className="range-inputs">
            <input
              type="number"
              value={manyFrom}
              onChange={e => setManyFrom(e.target.value)}
              placeholder="From (e.g., 1)"
            />
            <input
              type="number"
              value={manyTo}
              onChange={e => setManyTo(e.target.value)}
              placeholder="To (e.g., 20)"
            />
          </div>
          <button className="qr-btn" onClick={e => { e.preventDefault(); generateManyQRCodes(); }} disabled={manyGenerating}>
            {manyGenerating ? "Generating..." : "Generate & Download ZIP"}
          </button>
          {zipUrl && (
            <div className="qr-display">
              <a 
                href={zipUrl} 
                download={`QrCodes_From_${manyFrom}_To_${manyTo}.zip`} 
                className="download-btn"
              >
                📦 Download ZIP
              </a>
            </div>
          )}
          {/* Hidden QR codes for export */}
          <div className="hidden-qr">
            {qrIds.map((id) => (
              <div className="qr-container" key={id}>
                <QRCode
                  value={`https://topphysics.org/?id=${id}`}
                  size={qrSize}
                  ecLevel="H"
                  logoImage="/logo.png"
                  logoWidth={logoSize}
                  logoHeight={logoSize}
                  logoPadding={3}
                  logoPaddingStyle="square"
                  logoBackgroundColor="white"
                  logoBackgroundTransparent={false}
                  removeQrCodeBehindLogo={true}
                  logoPosition="center"
                  className="qr-svg-export"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
} 