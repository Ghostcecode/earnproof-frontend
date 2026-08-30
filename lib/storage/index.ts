/**
 * Browser storage utilities with versioning and migration support
 * 
 * This module provides a structured approach to browser storage with:
 * - Versioned schemas
 * - Migration support
 * - Type safety
 * - Clear ownership and retention policies
 */

export const STORAGE_KEYS = {
  SESSION: 'earnproof.session' as const,
} as const;

export type StorageKey = keyof typeof STORAGE_KEYS;

export interface StorageSchema {
  [STORAGE_KEYS.SESSION]: {
    version: 1;
    data: {
      token: string;
      user: {
        id: string;
        walletAddress: string;
        email?: string;
      };
    };
  };
}

// Current versions of each storage schema
export const CURRENT_VERSIONS: Record<StorageKey, number> = {
  SESSION: 1,
};

export interface StorageMetadata {
  version: number;
  timestamp: string;
  key: StorageKey;
}

export type StoredValue<K extends StorageKey> = StorageSchema[K];

/**
 * Base storage interface
 */
export interface StorageDriver {
  getItem<K extends StorageKey>(key: K): string | null;
  setItem<K extends StorageKey>(key: K, value: string): void;
  removeItem<K extends StorageKey>(key: K): void;
}

/**
 * Default storage driver using localStorage
 */
export const localStorageDriver: StorageDriver = {
  getItem: (key) => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(STORAGE_KEYS[key]);
  },
  setItem: (key, value) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS[key], value);
  },
  removeItem: (key) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(STORAGE_KEYS[key]);
  },
};

/**
 * Migration functions for each storage key
 */
export const migrations: Record<StorageKey, Record<number, (data: any) => any>> = {
  SESSION: {
    // Version 1 is current - no migration needed
    1: (data) => data,
  },
};

/**
 * Safely get a value from storage with migration support
 */
export function getStorageValue<K extends StorageKey>(
  key: K,
  driver: StorageDriver = localStorageDriver
): StoredValue<K> | null {
  try {
    const raw = driver.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    
    // Check if it has version metadata
    if (parsed && typeof parsed === 'object' && 'version' in parsed) {
      const version = parsed.version;
      const currentVersion = CURRENT_VERSIONS[key];
      
      if (version === currentVersion) {
        return parsed as StoredValue<K>;
      }
      
      // Try to migrate
      const migrated = migrateValue(key, parsed, version, currentVersion);
      if (migrated) {
        // Save migrated value
        setStorageValue(key, migrated, driver);
        return migrated as StoredValue<K>;
      }
      
      // Migration failed - remove corrupted data
      driver.removeItem(key);
      return null;
    }
    
    // Legacy format without version - try to migrate
    const migrated = migrateLegacyValue(key, parsed);
    if (migrated) {
      setStorageValue(key, migrated, driver);
      return migrated as StoredValue<K>;
    }
    
    // Cannot migrate - remove
    driver.removeItem(key);
    return null;
  } catch (error) {
    // Parse error or other issue - remove corrupted data
    console.error(`Failed to parse storage value for key ${key}:`, error);
    driver.removeItem(key);
    return null;
  }
}

/**
 * Set a value in storage with version metadata
 */
export function setStorageValue<K extends StorageKey>(
  key: K,
  value: Omit<StoredValue<K>, 'version' | 'timestamp' | 'key'>,
  driver: StorageDriver = localStorageDriver
): void {
  try {
    const storedValue: StoredValue<K> = {
      ...value,
      version: CURRENT_VERSIONS[key],
      timestamp: new Date().toISOString(),
      key,
    } as StoredValue<K>;
    
    driver.setItem(key, JSON.stringify(storedValue));
  } catch (error) {
    console.error(`Failed to set storage value for key ${key}:`, error);
  }
}

/**
 * Remove a value from storage
 */
export function removeStorageValue<K extends StorageKey>(
  key: K,
  driver: StorageDriver = localStorageDriver
): void {
  driver.removeItem(key);
}

/**
 * Clear all application storage
 */
export function clearAllStorage(driver: StorageDriver = localStorageDriver): void {
  Object.keys(STORAGE_KEYS).forEach((key) => {
    driver.removeItem(key as StorageKey);
  });
}

/**
 * Migrate a value from an older version to current version
 */
function migrateValue<K extends StorageKey>(
  key: K,
  value: any,
  fromVersion: number,
  toVersion: number
): StoredValue<K> | null {
  try {
    let current = value;
    
    // Apply migrations in sequence
    for (let v = fromVersion + 1; v <= toVersion; v++) {
      const migration = migrations[key]?.[v];
      if (migration) {
        current = migration(current);
      } else {
        // No migration path - cannot migrate
        return null;
      }
    }
    
    return {
      ...current,
      version: toVersion,
      timestamp: new Date().toISOString(),
      key,
    } as StoredValue<K>;
  } catch (error) {
    console.error(`Migration failed for ${key} from v${fromVersion} to v${toVersion}:`, error);
    return null;
  }
}

/**
 * Migrate a legacy value (without version) to current version
 */
function migrateLegacyValue<K extends StorageKey>(
  key: K,
  legacyValue: any
): StoredValue<K> | null {
  // Session migration from legacy format
  if (key === 'SESSION') {
    try {
      // Legacy format: { token: string, user: { ... } }
      if (legacyValue && typeof legacyValue === 'object' && 'token' in legacyValue && 'user' in legacyValue) {
        return {
          version: 1,
          timestamp: new Date().toISOString(),
          key: 'SESSION',
          data: {
            token: legacyValue.token,
            user: legacyValue.user,
          },
        } as StoredValue<K>;
      }
    } catch (error) {
      console.error('Legacy session migration failed:', error);
    }
  }
  
  return null;
}

/**
 * Get storage statistics for debugging
 */
export function getStorageStats(): Record<string, any> {
  if (typeof window === 'undefined') return {};
  
  const stats: Record<string, any> = {};
  
  Object.entries(STORAGE_KEYS).forEach(([keyName, keyValue]) => {
    const key = keyName as StorageKey;
    const value = getStorageValue(key);
    
    stats[keyValue] = {
      exists: value !== null,
      version: value?.version || 'none',
      size: value ? JSON.stringify(value).length : 0,
      age: value?.timestamp ? 
        Math.floor((Date.now() - new Date(value.timestamp).getTime()) / 1000) + 's' : 
        'unknown',
    };
  });
  
  return stats;
}