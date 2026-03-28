import { format, formatDistanceToNow, parseISO, isToday, isYesterday } from 'date-fns';

export const formatTime = (isoString) => {
  try {
    return format(parseISO(isoString), 'hh:mm a');
  } catch {
    return '--:--';
  }
};

export const formatDate = (isoString) => {
  try {
    const date = parseISO(isoString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM dd, yyyy');
  } catch {
    return '---';
  }
};

export const formatDateFull = (isoString) => {
  try {
    return format(parseISO(isoString), 'EEEE, MMMM dd yyyy');
  } catch {
    return '---';
  }
};

export const formatDateShort = (isoString) => {
  try {
    return format(parseISO(isoString), 'MMM dd');
  } catch {
    return '---';
  }
};

export const timeAgo = (isoString) => {
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
  } catch {
    return '---';
  }
};

export const formatDuration = (minutes) => {
  if (!minutes || minutes === 0) return '0 min';
  const m = Number(minutes);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
};

export const getTodayString = () => new Date().toISOString().split('T')[0];

export const groupEntriesByDate = (entries) => {
  const groups = {};
  entries.forEach((entry) => {
    const date = entry.createdAt.split('T')[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(entry);
  });
  return groups;
};

export const getEntrySubtitle = (entry) => {
  switch (entry.type) {
    case 'milk':
      return entry.amount_ml
        ? `${entry.amount_ml} ml · ${entry.feed_type || 'Feed'}`
        : entry.feed_type || 'Feed';
    case 'pee':
      return 'Diaper changed';
    case 'poop':
      return entry.consistency ? `${entry.consistency}` : 'Diaper changed';
    case 'cry':
      return entry.duration_min
        ? `Duration: ${formatDuration(entry.duration_min)}`
        : entry.reason || 'Cry recorded';
    case 'sleep':
      return entry.duration_min
        ? `Slept for ${formatDuration(entry.duration_min)}`
        : entry.sleep_type || 'Sleep recorded';
    case 'shower':
      return entry.bath_type || 'Bath / Shower';
    default:
      return '';
  }
};
