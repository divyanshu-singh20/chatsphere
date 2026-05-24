export const passwordStrength = (value) => {
  const checks = [/.{8,}/, /[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/];
  return checks.every((rule) => rule.test(value));
};

export const isValidEmailOrPhone = (value) => {
  if (!value) return false;
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phone = /^\+?[0-9]{7,15}$/;
  return email.test(value) || phone.test(value);
};

export const required = (value) => Boolean(value && String(value).trim().length > 0);