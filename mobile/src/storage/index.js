import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ENTRIES: 'baby_care_entries',
  BABY_PROFILE: 'baby_profile',
};

// ─── Entry Helpers ───────────────────────────────────────────────────────────

export const generateId = () =>
  `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ─── Baby Profile ────────────────────────────────────────────────────────────

export const saveBabyProfile = async (profile) => {
  try {
    await AsyncStorage.setItem(KEYS.BABY_PROFILE, JSON.stringify(profile));
    return true;
  } catch (e) {
    console.error('saveBabyProfile error:', e);
    return false;
  }
};

export const getBabyProfile = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.BABY_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error('getBabyProfile error:', e);
    return null;
  }
};

// ─── Entries ─────────────────────────────────────────────────────────────────

export const getAllEntries = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ENTRIES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('getAllEntries error:', e);
    return [];
  }
};

export const addEntry = async (entry) => {
  try {
    const entries = await getAllEntries();
    const newEntry = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      ...entry,
    };
    const updated = [newEntry, ...entries];
    await AsyncStorage.setItem(KEYS.ENTRIES, JSON.stringify(updated));
    return newEntry;
  } catch (e) {
    console.error('addEntry error:', e);
    return null;
  }
};

export const updateEntry = async (id, updates) => {
  try {
    const entries = await getAllEntries();
    const updated = entries.map((e) =>
      e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
    );
    await AsyncStorage.setItem(KEYS.ENTRIES, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.error('updateEntry error:', e);
    return false;
  }
};

export const deleteEntry = async (id) => {
  try {
    const entries = await getAllEntries();
    const updated = entries.filter((e) => e.id !== id);
    await AsyncStorage.setItem(KEYS.ENTRIES, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.error('deleteEntry error:', e);
    return false;
  }
};

export const getEntriesByType = async (type) => {
  const entries = await getAllEntries();
  return entries.filter((e) => e.type === type);
};

export const getEntriesByDate = async (dateStr) => {
  // dateStr: 'YYYY-MM-DD'
  const entries = await getAllEntries();
  return entries.filter((e) => e.createdAt.startsWith(dateStr));
};

export const getEntriesForDateRange = async (startDate, endDate) => {
  const entries = await getAllEntries();
  return entries.filter((e) => {
    const d = new Date(e.createdAt);
    return d >= startDate && d <= endDate;
  });
};

// ─── Stats ───────────────────────────────────────────────────────────────────

export const getTodayStats = async () => {
  const today = new Date().toISOString().split('T')[0];
  const entries = await getEntriesByDate(today);

  const stats = {
    milk: { count: 0, totalOz: 0 },
    pee: { count: 0 },
    poop: { count: 0 },
    cry: { count: 0, totalMin: 0 },
    sleep: { count: 0, totalMin: 0 },
    shower: { count: 0 },
  };

  entries.forEach((e) => {
    switch (e.type) {
      case 'milk':
        stats.milk.count++;
        stats.milk.totalOz += Number(e.amount_oz) || 0;
        break;
      case 'pee':
        stats.pee.count++;
        break;
      case 'poop':
        stats.poop.count++;
        break;
      case 'cry':
        stats.cry.count++;
        stats.cry.totalMin += Number(e.duration_min) || 0;
        break;
      case 'sleep':
        stats.sleep.count++;
        stats.sleep.totalMin += Number(e.duration_min) || 0;
        break;
      case 'shower':
        stats.shower.count++;
        break;
    }
  });

  return { stats, entries, date: today };
};

export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove([KEYS.ENTRIES, KEYS.BABY_PROFILE]);
    return true;
  } catch (e) {
    return false;
  }
};
