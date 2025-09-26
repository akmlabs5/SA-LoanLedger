export const getSmartLoanDefaults = () => {
  const today = new Date();
  const defaultDueDate = new Date(today);
  defaultDueDate.setMonth(today.getMonth() + 3); // 3 months from now

  return {
    startDate: today.toISOString().split('T')[0],
    dueDate: defaultDueDate.toISOString().split('T')[0],
    siborRate: '5.75', // Current SIBOR rate
    bankRate: '2.50', // Typical bank margin
  };
};

export const getBusinessDays = (startDate: Date, days: number): Date => {
  const result = new Date(startDate);
  let addedDays = 0;

  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      addedDays++;
    }
  }

  return result;
};