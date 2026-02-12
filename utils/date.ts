
export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString('fr-FR');
};

export const isLate = (planned: string | null, actual: string | null): boolean => {
  if (!planned) return false;
  if (!actual) {
    return new Date(planned) < new Date();
  }
  return new Date(actual) > new Date(planned);
};

export const getLateStatus = (planned: string | null, actual: string | null) => {
  if (!planned) return "pending";
  if (!actual && new Date(planned) < new Date()) return "late";
  if (actual && new Date(actual) > new Date(planned)) return "delay-realized";
  if (actual) return "done";
  return "pending";
};

export const calculateDaysBetween = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// Calcule le nombre de jours ouvrables entre deux dates (exclut Sam/Dim)
export const calculateBusinessDays = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  let count = 0;
  const current = new Date(startDate);
  const forward = endDate >= startDate;

  while (current.getTime() !== endDate.getTime()) {
    current.setDate(current.getDate() + (forward ? 1 : -1));
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      count += forward ? 1 : -1;
    }
  }
  return count;
};

// Ajoute N jours ouvrables à une date, retourne YYYY-MM-DD
export const addBusinessDays = (dateStr: string, businessDays: number): string => {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  let added = 0;
  while (added < businessDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return date.toISOString().split('T')[0];
};

// Ajoute N jours calendaires à une date, retourne YYYY-MM-DD
export const addCalendarDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// Calcule les jours restants jusqu'à une deadline en jours ouvrables
export const getBusinessDaysRemaining = (
  referenceDate: string,
  totalBusinessDays: number
): { remaining: number; total: number; isExpired: boolean; deadlineDate: string } => {
  const deadlineDate = addBusinessDays(referenceDate, totalBusinessDays);
  const today = new Date().toISOString().split('T')[0];
  const remaining = calculateBusinessDays(today, deadlineDate);
  return {
    remaining: Math.max(0, remaining),
    total: totalBusinessDays,
    isExpired: remaining <= 0,
    deadlineDate
  };
};

// Calcule les jours restants jusqu'à une deadline en jours calendaires
export const getCalendarDaysRemaining = (
  referenceDate: string,
  totalDays: number
): { remaining: number; total: number; isExpired: boolean; deadlineDate: string } => {
  const deadlineDate = addCalendarDays(referenceDate, totalDays);
  const today = new Date().toISOString().split('T')[0];
  const remaining = calculateDaysBetween(today, deadlineDate);
  const isExpired = new Date(today) >= new Date(deadlineDate);
  return {
    remaining: isExpired ? 0 : remaining,
    total: totalDays,
    isExpired,
    deadlineDate
  };
};
