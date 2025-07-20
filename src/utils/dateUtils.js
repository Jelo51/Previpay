export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export const getUpcomingPayments = (payments, days = 30) => {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);

  return payments.filter(payment => {
    const paymentDate = new Date(payment.date);
    return paymentDate >= today && paymentDate <= futureDate;
  });
};

export const getMonthlyTotal = (payments) => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return payments
    .filter(payment => {
      const paymentDate = new Date(payment.date);
      return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
    })
    .reduce((total, payment) => total + payment.amount, 0);
};

export const getPaymentsByCategory = (payments) => {
  const categories = {};
  payments.forEach(payment => {
    if (!categories[payment.category]) {
      categories[payment.category] = 0;
    }
    categories[payment.category] += payment.amount;
  });
  return categories;
};