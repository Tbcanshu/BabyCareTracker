import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  GROWTH_PHOTOS: "growth_photos",
  GROWTH_MEASUREMENTS: "growth_measurements",
  GROWTH_MILESTONES: "growth_milestones",
};

export const generateId = () =>
  `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ─── Photos ──────────────────────────────────────────────────────────────────

export const getAllPhotos = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.GROWTH_PHOTOS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("getAllPhotos error:", e);
    return [];
  }
};

export const addPhoto = async (photo) => {
  try {
    const photos = await getAllPhotos();
    const newPhoto = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      ...photo,
    };
    const updated = [newPhoto, ...photos];
    await AsyncStorage.setItem(KEYS.GROWTH_PHOTOS, JSON.stringify(updated));
    return newPhoto;
  } catch (e) {
    console.error("addPhoto error:", e);
    return null;
  }
};

export const deletePhoto = async (id) => {
  try {
    const photos = await getAllPhotos();
    const updated = photos.filter((p) => p.id !== id);
    await AsyncStorage.setItem(KEYS.GROWTH_PHOTOS, JSON.stringify(updated));
    return true;
  } catch (e) {
    return false;
  }
};

// ─── Measurements ─────────────────────────────────────────────────────────────

export const getAllMeasurements = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.GROWTH_MEASUREMENTS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const addMeasurement = async (measurement) => {
  try {
    const list = await getAllMeasurements();
    const newItem = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      ...measurement,
    };
    const updated = [newItem, ...list];
    await AsyncStorage.setItem(
      KEYS.GROWTH_MEASUREMENTS,
      JSON.stringify(updated),
    );
    return newItem;
  } catch (e) {
    return null;
  }
};

export const deleteMeasurement = async (id) => {
  try {
    const list = await getAllMeasurements();
    const updated = list.filter((m) => m.id !== id);
    await AsyncStorage.setItem(
      KEYS.GROWTH_MEASUREMENTS,
      JSON.stringify(updated),
    );
    return true;
  } catch (e) {
    return false;
  }
};

// ─── Milestones ───────────────────────────────────────────────────────────────

export const getAllMilestones = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.GROWTH_MILESTONES);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const toggleMilestone = async (milestoneKey, date) => {
  try {
    const list = await getAllMilestones();
    const existing = list.find((m) => m.key === milestoneKey);
    let updated;
    if (existing) {
      updated = list.filter((m) => m.key !== milestoneKey);
    } else {
      updated = [
        ...list,
        { key: milestoneKey, achievedAt: date || new Date().toISOString() },
      ];
    }
    await AsyncStorage.setItem(KEYS.GROWTH_MILESTONES, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};

// ─── Group photos by month ────────────────────────────────────────────────────

export const groupPhotosByMonth = (photos) => {
  const groups = {};
  photos.forEach((photo) => {
    const date = new Date(photo.takenAt || photo.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(photo);
  });
  return groups;
};

// ─── Group measurements by month ──────────────────────────────────────────────

export const groupMeasurementsByMonth = (measurements) => {
  const groups = {};
  measurements.forEach((m) => {
    const date = new Date(m.measuredAt || m.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });
  return groups;
};
