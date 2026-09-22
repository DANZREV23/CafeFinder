// server/src/scripts/validate-env.ts
import dotenv from 'dotenv';
dotenv.config();

export interface ValidationItem {
  name: string;
  type: 'REQUIRED' | 'CONDITIONAL' | 'OPTIONAL';
  status: 'CONFIGURED' | 'MISSING' | 'DEFAULT';
  description: string;
  notes?: string;
}

export interface ValidationResult {
  valid: boolean;
  items: ValidationItem[];
  missingRequired: string[];
}

export function validateEnvironment(): ValidationResult {
  const items: ValidationItem[] = [];
  const missingRequired: string[] = [];

  // 1. Database URL or parameters (Required)
  const hasDbUrl = Boolean(
    process.env.PRISMA_DATABASE_URL ||
    process.env.DATABASE_URL ||
    (process.env.SQL_USER && process.env.SQL_PASSWORD && process.env.SQL_HOST) ||
    (process.env.SQL_ADMIN_USER && process.env.SQL_ADMIN_PASSWORD && process.env.SQL_HOST) ||
    (process.env.DB_USERNAME && process.env.DB_PASSWORD && process.env.DB_HOST)
  );

  items.push({
    name: 'DATABASE_URL / PRISMA_DATABASE_URL',
    type: 'REQUIRED',
    status: hasDbUrl ? 'CONFIGURED' : 'MISSING',
    description: 'PostgreSQL connection string or parameters for Prisma ORM',
  });
  if (!hasDbUrl) missingRequired.push('DATABASE_URL');

  // 2. PORT (Required with default)
  const port = process.env.PORT;
  items.push({
    name: 'PORT',
    type: 'REQUIRED',
    status: port ? 'CONFIGURED' : 'DEFAULT',
    description: 'Server listen port',
    notes: port ? `Port ${port}` : 'Defaults to 3000',
  });

  // 3. NODE_ENV (Required with default)
  const nodeEnv = process.env.NODE_ENV;
  items.push({
    name: 'NODE_ENV',
    type: 'REQUIRED',
    status: nodeEnv ? 'CONFIGURED' : 'DEFAULT',
    description: 'Application runtime environment',
    notes: nodeEnv || 'Defaults to development',
  });

  // 4. CLIENT_URL / PUBLIC_SITE_URL (Optional / CORS origin)
  const clientUrl = process.env.CLIENT_URL || process.env.PUBLIC_SITE_URL;
  items.push({
    name: 'CLIENT_URL',
    type: 'OPTIONAL',
    status: clientUrl ? 'CONFIGURED' : 'DEFAULT',
    description: 'Allowed frontend origin for CORS in production',
    notes: clientUrl ? 'Configured' : 'Defaults to local/same-origin',
  });

  // 5. UPLOAD_DIR (Optional with default)
  const uploadDir = process.env.UPLOAD_DIR;
  items.push({
    name: 'UPLOAD_DIR',
    type: 'OPTIONAL',
    status: uploadDir ? 'CONFIGURED' : 'DEFAULT',
    description: 'Custom path for user uploaded media files',
    notes: uploadDir || 'Defaults to ./uploads',
  });

  // 6. MAP_API_KEY (Optional)
  const mapApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
  items.push({
    name: 'GOOGLE_MAPS_API_KEY',
    type: 'OPTIONAL',
    status: mapApiKey ? 'CONFIGURED' : 'MISSING',
    description: 'Google Maps API Key for geocoding and map rendering',
    notes: mapApiKey ? 'Configured' : 'Maps fallback to static/default view',
  });

  // 7. BACKUP_ENABLED & BACKUP_DIR (Optional)
  const backupEnabled = process.env.BACKUP_ENABLED;
  items.push({
    name: 'BACKUP_ENABLED',
    type: 'OPTIONAL',
    status: backupEnabled !== undefined ? 'CONFIGURED' : 'DEFAULT',
    description: 'Enable automated scheduled backups',
    notes: backupEnabled === 'true' ? 'Enabled' : 'Disabled or default',
  });

  // 8. EMAIL SYSTEM (Conditional)
  const emailEnabled = process.env.EMAIL_ENABLED === 'true';
  items.push({
    name: 'EMAIL_ENABLED',
    type: 'OPTIONAL',
    status: process.env.EMAIL_ENABLED !== undefined ? 'CONFIGURED' : 'DEFAULT',
    description: 'Master switch for email notification queue processor',
    notes: emailEnabled ? 'Enabled' : 'Disabled (emails logged to console or bypassed)',
  });

  if (emailEnabled) {
    const emailProvider = process.env.EMAIL_PROVIDER || 'console';
    items.push({
      name: 'EMAIL_PROVIDER',
      type: 'CONDITIONAL',
      status: process.env.EMAIL_PROVIDER ? 'CONFIGURED' : 'DEFAULT',
      description: 'Email transport provider (smtp, console)',
      notes: emailProvider,
    });

    if (emailProvider === 'smtp') {
      const hasSmtp = Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASSWORD
      );
      items.push({
        name: 'SMTP_CREDENTIALS (HOST, USER, PASSWORD)',
        type: 'CONDITIONAL',
        status: hasSmtp ? 'CONFIGURED' : 'MISSING',
        description: 'SMTP connection credentials required when EMAIL_PROVIDER=smtp',
      });
      if (!hasSmtp) {
        missingRequired.push('SMTP_CREDENTIALS (HOST/USER/PASSWORD)');
      }
    }
  }

  // 9. RELEASE_RETENTION_COUNT (Optional)
  const retentionCount = process.env.RELEASE_RETENTION_COUNT;
  items.push({
    name: 'RELEASE_RETENTION_COUNT',
    type: 'OPTIONAL',
    status: retentionCount ? 'CONFIGURED' : 'DEFAULT',
    description: 'Number of past releases to retain for rollback',
    notes: retentionCount ? `${retentionCount} releases` : 'Defaults to 3',
  });

  const valid = missingRequired.length === 0;

  return {
    valid,
    items,
    missingRequired,
  };
}

export function printValidationReport(): boolean {
  console.log('====================================================');
  console.log('  CafeFinder Production Environment Validation');
  console.log('====================================================');
  
  const result = validateEnvironment();

  for (const item of result.items) {
    let icon = '[OK]';
    if (item.status === 'MISSING') {
      icon = item.type === 'REQUIRED' || item.type === 'CONDITIONAL' ? '[FAIL]' : '[INFO]';
    } else if (item.status === 'DEFAULT') {
      icon = '[DEF]';
    }

    const noteStr = item.notes ? ` (${item.notes})` : '';
    console.log(`${icon} [${item.type}] ${item.name}: ${item.status}${noteStr}`);
  }

  console.log('----------------------------------------------------');
  if (result.valid) {
    console.log('[SUCCESS]: All required production environment variables are properly configured.');
  } else {
    console.error(`[ERROR]: Missing required production variables: ${result.missingRequired.join(', ')}`);
  }
  console.log('====================================================');

  return result.valid;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ok = printValidationReport();
  if (!ok) process.exit(1);
}
