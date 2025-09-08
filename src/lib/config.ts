export interface AppConfig {
  github: {
    token: string;
    owner: string;
    repo: string;
    branch: string;
  };
  app: {
    nodeEnv: string;
    isDev: boolean;
    isProd: boolean;
  };
}

/**
 * Get configuration from environment variables
 */
export function getConfig(): AppConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  return {
    github: {
      token: process.env.GITHUB_TOKEN || '',
      owner: process.env.GITHUB_OWNER || '',
      repo: process.env.GITHUB_REPO || '',
      branch: process.env.GITHUB_BRANCH || 'main',
    },
    app: {
      nodeEnv,
      isDev: nodeEnv === 'development',
      isProd: nodeEnv === 'production',
    },
  };
}

/**
 * Validate that all required environment variables are present
 */
export function validateConfig(config: AppConfig): string[] {
  const errors: string[] = [];

  if (!config.github.token) {
    errors.push('GITHUB_TOKEN is required');
  }

  if (!config.github.owner) {
    errors.push('GITHUB_OWNER is required');
  }

  if (!config.github.repo) {
    errors.push('GITHUB_REPO is required');
  }

  if (config.github.token && !config.github.token.startsWith('ghp_') && !config.github.token.startsWith('github_pat_')) {
    errors.push('GITHUB_TOKEN appears to be invalid (should start with ghp_ or github_pat_)');
  }

  return errors;
}

/**
 * Get validated configuration or throw error
 */
export function getValidatedConfig(): AppConfig {
  const config = getConfig();
  const errors = validateConfig(config);

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }

  return config;
}

/**
 * Check if GitHub integration is properly configured
 */
export function isGitHubConfigured(): boolean {
  try {
    const config = getConfig();
    const errors = validateConfig(config);
    return errors.length === 0;
  } catch {
    return false;
  }
}

/**
 * Sanitize config for logging (remove sensitive data)
 */
export function sanitizeConfigForLogging(config: AppConfig): Partial<AppConfig> {
  return {
    github: {
      token: config.github.token ? '[REDACTED]' : '[MISSING]',
      owner: config.github.owner || '[MISSING]',
      repo: config.github.repo || '[MISSING]',
      branch: config.github.branch,
    },
    app: config.app,
  };
}
