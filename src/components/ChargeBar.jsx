import React from 'react';

export default function ChargeBar({ charge }) {
  if (charge <= 0) return null;
  
  return (
    <div style={{
      position: 'fixed',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, 40px)',
      width: '200px',
      height: '6px',
      background: 'rgba(0,0,0,0.3)',
      borderRadius: '3px',
      overflow: 'hidden',
      pointerEvents: 'none'
    }}>
      <div style={{
        width: `${charge * 100}%`,
        height: '100%',
        background: charge >= 0.75 ? '#ff0' : '#88f',
        transition: 'background-color 0.2s',
        boxShadow: charge >= 0.75 ? '0 0 10px #ff0' : 'none'
      }} />
    </div>
  );
}