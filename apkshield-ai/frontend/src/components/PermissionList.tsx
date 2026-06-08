import { AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';

interface Props {
  permissions: string[];
  dangerous: string[];
}

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  'android.permission.READ_SMS': 'Read SMS messages',
  'android.permission.SEND_SMS': 'Send SMS messages',
  'android.permission.RECEIVE_SMS': 'Intercept incoming SMS',
  'android.permission.READ_CONTACTS': 'Access contact list',
  'android.permission.WRITE_CONTACTS': 'Modify contact list',
  'android.permission.READ_CALL_LOG': 'Read call history',
  'android.permission.CAMERA': 'Access camera',
  'android.permission.RECORD_AUDIO': 'Record audio / microphone',
  'android.permission.ACCESS_FINE_LOCATION': 'Precise GPS location',
  'android.permission.ACCESS_COARSE_LOCATION': 'Approximate location',
  'android.permission.GET_ACCOUNTS': 'Access account credentials',
  'android.permission.READ_EXTERNAL_STORAGE': 'Read device storage',
  'android.permission.WRITE_EXTERNAL_STORAGE': 'Write to device storage',
  'android.permission.INTERNET': 'Full internet access',
  'android.permission.RECEIVE_BOOT_COMPLETED': 'Start on device boot',
  'android.permission.READ_PHONE_STATE': 'Access device ID / IMEI',
  'android.permission.CALL_PHONE': 'Make phone calls',
  'android.permission.BIND_DEVICE_ADMIN': 'Device administrator access',
  'android.permission.SYSTEM_ALERT_WINDOW': 'Draw over other apps',
  'android.permission.PROCESS_OUTGOING_CALLS': 'Intercept outgoing calls',
  'android.permission.USE_BIOMETRIC': 'Access biometric sensors',
};

export default function PermissionList({ permissions, dangerous }: Props) {
  const dangerousSet = new Set(dangerous);

  return (
    <div className="space-y-2">
      {permissions.length === 0 ? (
        <p className="text-cyber-text-dim text-sm py-4 text-center">No permissions detected.</p>
      ) : (
        permissions.map((perm) => {
          const isDangerous = dangerousSet.has(perm);
          const shortName = perm.replace('android.permission.', '');
          const description = PERMISSION_DESCRIPTIONS[perm];

          return (
            <div
              key={perm}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-200 ${
                isDangerous
                  ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                  : 'bg-cyber-surface border-cyber-border hover:border-cyber-accent/20'
              }`}
            >
              <div className="flex-shrink-0">
                {isDangerous ? (
                  <ShieldAlert size={16} className="text-red-400" />
                ) : (
                  <ShieldCheck size={16} className="text-cyber-text-dim" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <code className={`text-xs font-mono ${isDangerous ? 'text-red-300' : 'text-cyber-muted'}`}>
                    {shortName}
                  </code>
                  {isDangerous && (
                    <span className="tag-danger text-[10px]">
                      <AlertTriangle size={10} className="mr-0.5" />
                      DANGEROUS
                    </span>
                  )}
                </div>
                {description && (
                  <p className="text-xs text-cyber-text-dim mt-0.5">{description}</p>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
