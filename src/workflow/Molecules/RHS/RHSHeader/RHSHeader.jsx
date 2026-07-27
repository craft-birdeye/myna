import React from 'react';
import { Button } from '../../../elemental-stubs';
import PlayArrowIcon from './icons/play_arrow.svg';

export default function RHSPanelHeader({
  title = 'Title',
  onPreview,
  onClose,
  onBack,
  showActions = true,
  showMoreMenu = false,
}) {
  const svgStyle = { width: 24, height: 24, display: 'block' };
  const iconStyle = {
    fontSize: 24,
    lineHeight: 1,
    color: '#303030',
    fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 15px',
      height: 60,
      background: '#ffffff',
      boxSizing: 'border-box',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, flex: 1 }}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: '#555', flexShrink: 0, borderRadius: 4 }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5.98854 10.6267L8.73215 13.3703C8.85608 13.4943 8.91724 13.6393 8.91565 13.8054C8.91403 13.9715 8.85287 14.1192 8.73215 14.2485C8.60288 14.3778 8.45438 14.4446 8.28665 14.4488C8.11892 14.4531 7.97042 14.3906 7.84115 14.2613L4.10877 10.529C3.95813 10.3783 3.88281 10.2026 3.88281 10.0017C3.88281 9.80088 3.95813 9.62514 4.10877 9.4745L7.84115 5.74212C7.96508 5.61819 8.11224 5.55703 8.28265 5.55862C8.45305 5.56024 8.60288 5.62567 8.73215 5.75494C8.85287 5.88421 8.91537 6.03058 8.91965 6.19404C8.92392 6.3575 8.86142 6.50386 8.73215 6.63312L5.98854 9.37675H15.7931C15.9704 9.37675 16.1189 9.43658 16.2386 9.55623C16.3582 9.67588 16.418 9.82438 16.418 10.0017C16.418 10.1791 16.3582 10.3276 16.2386 10.4472C16.1189 10.5669 15.9704 10.6267 15.7931 10.6267H5.98854Z" fill="currentColor"/>
            </svg>
          </button>
        )}
        <span style={{
          fontSize: 16,
          fontWeight: 400,
          lineHeight: '24px',
          letterSpacing: '-0.32px',
          color: '#212121',
          fontFamily: '"Roboto", sans-serif',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {title}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {showMoreMenu && (
          <button
            type="button"
            aria-label="More actions"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: '#555', borderRadius: 4 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, lineHeight: 1, fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}>more_vert</span>
          </button>
        )}
        {showActions && onPreview && (
          <Button
            type="link"
            customIcon={<img src={PlayArrowIcon} alt="Preview" style={svgStyle} />}
            onClick={onPreview}
            noHover
            aria-label="Preview"
          />
        )}
        <Button
          type="link"
          customIcon={
            <span className="material-symbols-outlined" style={iconStyle} aria-hidden>
              close
            </span>
          }
          onClick={onClose}
          noHover
          aria-label="Close"
        />
      </div>
    </div>
  );
}
