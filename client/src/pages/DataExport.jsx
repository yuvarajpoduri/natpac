import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileJson, FileSpreadsheet, Download, Shield, CheckCircle, AlertTriangle, Filter, Eye } from 'lucide-react';

const DataExport = () => {
  const [isExportingJSON, setIsExportingJSON] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [filters, setFilters] = useState({ mode: '', validationStatus: '' });
  const [previewData, setPreviewData] = useState([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const authToken = localStorage.getItem('natpac_token');

  useEffect(() => {
    fetchPreview();
  }, [filters]);

  const fetchPreview = async () => {
    setIsPreviewLoading(true);
    try {
      const query = new URLSearchParams(filters).toString();
      const response = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/export/preview?${query}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      setPreviewData(response.data.data.slice(0, 5));
    } catch {
      setExportMessage('Failed to fetch preview.');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const downloadFile = async (format) => {
    const isJson = format === 'json';
    if (isJson) setIsExportingJSON(true);
    else setIsExportingCSV(true);
    setExportMessage('');

    try {
      const query = new URLSearchParams(filters).toString();
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/export/${format}?${query}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      const blobData = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blobData);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `natpac_trips_export.${format}`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setExportMessage(`${format.toUpperCase()} export downloaded successfully.`);
    } catch {
      setExportMessage(`Failed to download ${format.toUpperCase()} export.`);
    } finally {
      if (isJson) setIsExportingJSON(false);
      else setIsExportingCSV(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Export</h1>
          <p className="page-subtitle">Download anonymized trip data tailored to your research</p>
        </div>
      </div>

      {/* Anonymization Notice */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'rgba(91, 202, 245, 0.08)', border: '1px solid #5BCAF5' }}>
        <div className="card-label" style={{ color: '#111111' }}><Shield size={13} /> Secure Anonymization</div>
        <div style={{ fontSize: '15px', color: '#666666', lineHeight: '1.65' }}>
          All extracted data is anonymized. User IDs are masked, and GPS coordinates are truncated to 3 decimals to protect residential locations.
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem', alignItems: 'start' }}>
        {/* Filters Card */}
        <div className="card">
          <div className="card-label" style={{ marginBottom: '1rem' }}><Filter size={13} /> Export Filters</div>
          <div className="field">
            <label>Travel Mode</label>
            <select value={filters.mode} onChange={e => setFilters({...filters, mode: e.target.value})}>
              <option value="">All Modes</option>
              <option value="Car">Car</option>
              <option value="Bus">Bus</option>
              <option value="Cycling">Cycling</option>
              <option value="Walking">Walking</option>
            </select>
          </div>
          <div className="field">
            <label>Validation Status</label>
            <select value={filters.validationStatus} onChange={e => setFilters({...filters, validationStatus: e.target.value})}>
              <option value="">All Trips</option>
              <option value="true">Only Validated</option>
              <option value="false">Pending Validation</option>
            </select>
          </div>
        </div>

        {/* Export Actions Card */}
        <div className="card">
           <div className="card-label" style={{ marginBottom: '1rem' }}><Download size={13} /> Export Formats</div>
           <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
             <button className="btn-brand" onClick={() => downloadFile('json')} disabled={isExportingJSON} style={{ width: '100%', justifyContent: 'center' }}>
               <FileJson size={16} /> {isExportingJSON ? 'Generating...' : 'Download JSON Dataset'}
             </button>
             <button className="btn-secondary" onClick={() => downloadFile('csv')} disabled={isExportingCSV} style={{ width: '100%', justifyContent: 'center' }}>
               <FileSpreadsheet size={16} /> {isExportingCSV ? 'Generating...' : 'Download CSV Spreadsheet'}
             </button>
           </div>
           {exportMessage && (
             <div style={{ marginTop: '1rem', fontSize: '13px', color: exportMessage.includes('success') ? '#34D399' : '#E24B4A', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
               {exportMessage.includes('success') ? <CheckCircle size={14} /> : <AlertTriangle size={14} />} {exportMessage}
             </div>
           )}
        </div>
      </div>

      {/* Data Preview Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 24px', borderBottom: '1px solid #E8E8E0' }}>
          <div className="card-label"><Eye size={13} /> Data Preview (First 5 Rows)</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead style={{ background: '#F2F2F2', textAlign: 'left' }}>
              <tr>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E0E0E0', fontSize: '12px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#666666' }}>Trip ID</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E0E0E0', fontSize: '12px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#666666' }}>Mode</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E0E0E0', fontSize: '12px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#666666' }}>Distance (m)</th>
                <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E0E0E0', fontSize: '12px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#666666' }}>Validated</th>
              </tr>
            </thead>
            <tbody>
              {isPreviewLoading ? (
                <tr><td colSpan="4" style={{ padding: '1.5rem', textAlign: 'center', color: '#888888' }}>Loading preview...</td></tr>
              ) : previewData.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '1.5rem', textAlign: 'center', color: '#888888' }}>No matching records.</td></tr>
              ) : previewData.map(row => (
                <tr key={row.tripId} style={{ borderBottom: '1px solid #E8E8E0' }}>
                  <td style={{ padding: '0.75rem 1rem', color: '#111111' }}>{row.tripId}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#111111' }}>{row.userValidatedMode || row.aiPredictedMode}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#111111' }}>{row.totalDistanceMeters}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className={`badge ${row.isValidated ? 'badge-success' : 'badge-info'}`}>
                      {row.isValidated ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataExport;

