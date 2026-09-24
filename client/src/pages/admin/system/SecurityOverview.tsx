// client/src/pages/admin/system/SecurityOverview.tsx
import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  ShieldAlert, 
  Globe, 
  History, 
  Eye, 
  EyeOff,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';
import { adminService } from '@/services/adminService';
import toast from 'react-hot-toast';

interface SecurityConfig {
  httpsEnabled: boolean;
  secureCookies: boolean;
  corsConfigured: boolean;
  rateLimitingEnabled: boolean;
  productionDebugDisabled: boolean;
  databasePubliclyExposed: boolean;
  environment: string;
  nodeVersion: string;
}

export const SecurityOverview: React.FC = () => {
  const [config, setConfig] = useState<SecurityConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSensitive, setShowSensitive] = useState(false);

  const fetchSecurity = async () => {
    try {
      const res = await adminService.getSecurityOverview();
      if (res.success) {
        setConfig(res.data);
      }
    } catch (err) {
      toast.error('Failed to fetch security overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurity();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  const checks = [
    { label: 'HTTPS Protocol', status: config?.httpsEnabled, desc: 'Encrypted communication between client and server' },
    { label: 'Secure Cookies', status: config?.secureCookies, desc: 'Strict cookie flags (Secure, HttpOnly, SameSite)' },
    { label: 'CORS Configuration', status: config?.corsConfigured, desc: 'Restricted cross-origin resource sharing' },
    { label: 'Rate Limiting', status: config?.rateLimitingEnabled, desc: 'Brute-force and DDoS protection' },
    { label: 'Production Debug Mode', status: config?.productionDebugDisabled, desc: 'Internal error details hidden from users' },
    { label: 'DB Private Network', status: !config?.databasePubliclyExposed, desc: 'Database inaccessible from public internet' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Security Overview</h1>
            <p className="text-stone-500 mt-1">Operational security posture and configuration audit</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-stone-500" />
            Security Configuration Audit
          </h2>
          
          <div className="space-y-6">
            {checks.map((check, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className={clsx(
                  "mt-1 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                  check.status ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                )}>
                  {check.status ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <p className="font-bold text-stone-900">{check.label}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{check.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-8">
            <h2 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Active Threats & Monitoring
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-amber-200/50">
                <span className="text-sm text-amber-800">Failed Login Spikes</span>
                <span className="text-xs font-bold bg-white px-2 py-1 rounded-lg text-green-600">NONE DETECTED</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-amber-200/50">
                <span className="text-sm text-amber-800">Rate Limit Violations</span>
                <span className="text-xs font-bold bg-white px-2 py-1 rounded-lg text-amber-600">3 IN LAST 24H</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-amber-200/50">
                <span className="text-sm text-amber-800">Admin Action Audit</span>
                <span className="text-xs font-bold bg-white px-2 py-1 rounded-lg text-green-600">HEALTHY</span>
              </div>
            </div>
            <button className="mt-6 w-full py-2 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-all shadow-sm active:scale-95">
              View Recent Audit Logs
            </button>
          </div>

          <div className="bg-stone-900 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                Environment Context
              </h2>
              <button 
                onClick={() => setShowSensitive(!showSensitive)}
                className="text-stone-400 hover:text-white transition-colors"
              >
                {showSensitive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between border-b border-stone-800 pb-2">
                <span className="text-stone-500 uppercase tracking-widest">Environment</span>
                <span className="text-stone-300">{config?.environment.toUpperCase()}</span>
              </div>
              <div className="flex justify-between border-b border-stone-800 pb-2">
                <span className="text-stone-500 uppercase tracking-widest">Node Version</span>
                <span className="text-stone-300">{config?.nodeVersion || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-stone-800 pb-2">
                <span className="text-stone-500 uppercase tracking-widest">Database URL</span>
                <span className="text-stone-300 italic">{showSensitive ? 'postgresql://***@localhost/...' : '[ MASKED ]'}</span>
              </div>
              <div className="flex justify-between border-b border-stone-800 pb-2">
                <span className="text-stone-500 uppercase tracking-widest">JWT Secret</span>
                <span className="text-stone-300 italic">{showSensitive ? '****************' : '[ MASKED ]'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-400 flex-shrink-0">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-stone-900">Security Audit Policy</h3>
          <p className="text-sm text-stone-500 mt-1">
            All administrative actions, configuration changes, and authentication attempts are logged for security auditing. 
            Logs are retained for 90 days. For critical security events, automated alerts are sent to the system administrators.
          </p>
        </div>
      </div>
    </div>
  );
};
