import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Salaries and Payout section has been decommissioned as requested.
 * Automatically redirect any traffic to /dashboard.
 */
export default function Salaries() {
  return <Navigate to="/dashboard" replace />;
}
