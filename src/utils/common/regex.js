// utils/regexUtils.js
module.exports = {
  // Phone number regex (supports international formats)
  PHONE:
    /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,3}[-\s.]?[0-9]{1,4}[-\s.]?[0-9]{1,4}$/,

  // Email regex
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  // Password regex (min 8 chars, at least one letter and one number)
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,

  // Name regex (allows letters, spaces, and basic punctuation)
  NAME: /^[a-zA-Z\s.'-]+$/,

  // Date (YYYY-MM-DD)
  DATE: /^\d{4}-\d{2}-\d{2}$/,

  // Time (HH:MM 24-hour format)
  TIME: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,

  // URL regex
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
};
