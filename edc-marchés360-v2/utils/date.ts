
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
  // On réinitialise les heures pour comparer uniquement les jours pleins
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};
