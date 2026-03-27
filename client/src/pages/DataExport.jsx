import { useState } from 'react';
import { FileJson, FileSpreadsheet, Download, Shield, CheckCircle, AlertTriangle } from 'lucide-react';

const DataExport = () => {
  const [isExportingJSON, setIsExportingJSON] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [exportMessage, setExportMessage] = useState('');

  const authToken = localStorage.getItem('natpac_token');

  const handleJSONExport = async () => {
    setIsExportingJSON(true);
    setExportMessage('');
    try {
      const response = await fetch('http://localhost:5000/api/export/json', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const blobData = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blobData);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = 'natpac_trips_export.json';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setExportMessage('JSON export downloaded successfully.');
    } catch {
      setExportMessage('Failed to download JSON export.');
    } finally {
      setIsExportingJSON(false);
    }
  };

  const handleCSVExport = async () => {
    setIsExportingCSV(true);
    setExportMessage('');
    try {
      const response = await fetch('http://localhost:5000/api/export/csv', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const blobData = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blobData);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = 'natpac_trips_export.csv';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setExportMessage('CSV export downloaded successfully.');
    } catch {
      setExportMessage('Failed to download CSV export.');
    } finally {
      setIsExportingCSV(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Data Export</h1>
          <p className="page-subtitle">Download anonymized trip data for research and planning</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-label" style={{ marginBottom: '1rem' }}>
          <Shield size={13} /> Data Anonymization Policy
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          All exported data is automatically anonymized before download.
          Personal details such as names and emails are never included.
          User IDs are replaced with anonymous identifiers (e.g., CITIZEN-A1B2C3).
          GPS coordinates are truncated to 3 decimal places (~111m precision) to protect
          exact residential locations while maintaining research-grade accuracy.
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 44, height: 44, background: 'rgba(59,130,246,0.12)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileJson size={22} style={{ color: 'var(--brand)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>JSON Format</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Structured data for applications</div>
            </div>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Best for importing into analytics tools, Python notebooks, or web dashboards.
            Each trip is a nested JSON object with full coordinate and prediction data.
          </div>
          <button
            className="btn-brand"
            style={{ width: '100%', justifyContent: 'center', padding: '0.72rem' }}
            onClick={handleJSONExport}
            disabled={isExportingJSON}
          >
            <Download size={15} />
            {isExportingJSON ? 'Generating...' : 'Download JSON'}
          </button>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 44, height: 44, background: 'var(--success-dim)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileSpreadsheet size={22} style={{ color: 'var(--success)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>CSV Format</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Spreadsheet compatible</div>
            </div>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            Best for opening in Excel, Google Sheets, or SPSS.
            Flat comma-separated format with one trip per row and labeled headers.
          </div>
          <button
            className="btn-brand"
            style={{ width: '100%', justifyContent: 'center', padding: '0.72rem', background: 'var(--success)' }}
            onClick={handleCSVExport}
            disabled={isExportingCSV}
          >
            <Download size={15} />
            {isExportingCSV ? 'Generating...' : 'Download CSV'}
          </button>
        </div>
      </div>

      {exportMessage && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.875rem 1.25rem' }}>
          {exportMessage.includes('successfully') ? (
            <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
          ) : (
            <AlertTriangle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          )}
          <span style={{ fontSize: '0.875rem', color: exportMessage.includes('successfully') ? 'var(--success)' : 'var(--danger)' }}>
            {exportMessage}
          </span>
        </div>
      )}

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-label" style={{ marginBottom: '0.875rem' }}>
          <FileJson size={13} /> Export Data Fields
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
          {[
            'Trip ID (anonymous)',
            'Citizen ID (hashed)',
            'Origin Lat/Lng (truncated)',
            'Destination Lat/Lng',
            'Origin Timestamp',
            'Average Speed',
            'Maximum Speed',
            'Total Distance',
            'Duration',
            'AI Predicted Mode',
            'User Validated Mode',
            'Trip Purpose',
            'Validation Status',
            'Recorded At'
          ].map((fieldName) => (
            <div
              key={fieldName}
              style={{
                padding: '0.5rem 0.75rem',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)'
              }}
            >
              {fieldName}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DataExport;
