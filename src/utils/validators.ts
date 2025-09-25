// Validation functions for various inputs

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone number validation (Turkish format)
export const isValidPhone = (phone: string): boolean => {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');
  // Turkish phone number format: 0XXX XXX XX XX or +90 XXX XXX XX XX
  const phoneRegex = /^(\+90|0)?[0-9]{10}$/;
  return phoneRegex.test(cleaned);
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    // Also accept URLs without protocol
    try {
      new URL(`https://${url}`);
      return true;
    } catch {
      return false;
    }
  }
};

// Turkish ID number validation (TC Kimlik No)
export const isValidTcNo = (tcNo: string): boolean => {
  if (!/^[1-9][0-9]{10}$/.test(tcNo)) return false;
  
  const digits = tcNo.split('').map(Number);
  
  // Algorithm check
  const sum1 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const sum2 = digits[1] + digits[3] + digits[5] + digits[7];
  
  const check1 = ((sum1 * 7) - sum2) % 10;
  const check2 = (sum1 + sum2 + digits[9]) % 10;
  
  return check1 === digits[9] && check2 === digits[10];
};

// Company tax number validation
export const isValidTaxNumber = (taxNumber: string): boolean => {
  // Turkish tax number is 10 digits
  return /^[0-9]{10}$/.test(taxNumber);
};

// Password strength validation
export const isStrongPassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('En az 8 karakter olmalı');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('En az bir büyük harf içermeli');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('En az bir küçük harf içermeli');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('En az bir rakam içermeli');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('En az bir özel karakter içermeli');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Date validation
export const isValidDate = (date: string): boolean => {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
};

// Future date validation
export const isFutureDate = (date: Date): boolean => {
  return date.getTime() > new Date().getTime();
};

// Past date validation
export const isPastDate = (date: Date): boolean => {
  return date.getTime() < new Date().getTime();
};

// Numeric validation
export const isNumeric = (value: string): boolean => {
  return !isNaN(Number(value)) && !isNaN(parseFloat(value));
};

// Positive number validation
export const isPositiveNumber = (value: number): boolean => {
  return value > 0;
};

// Integer validation
export const isInteger = (value: number): boolean => {
  return Number.isInteger(value);
};

// File type validation
export const isValidFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

// File size validation (in MB)
export const isValidFileSize = (file: File, maxSizeMB: number): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

// Image file validation
export const isImageFile = (file: File): boolean => {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return isValidFileType(file, imageTypes);
};

// PDF file validation
export const isPdfFile = (file: File): boolean => {
  return file.type === 'application/pdf';
};

// Excel file validation
export const isExcelFile = (file: File): boolean => {
  const excelTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  return isValidFileType(file, excelTypes);
};

// Coordinate validation
export const isValidCoordinate = (lat: number, lon: number): boolean => {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
};

// Turkish coordinate bounds
export const isInTurkey = (lat: number, lon: number): boolean => {
  // Approximate bounds for Turkey
  return lat >= 36 && lat <= 42 && lon >= 26 && lon <= 45;
};

// Power value validation (kW)
export const isValidPowerValue = (value: number): boolean => {
  return value >= 0 && value <= 100000; // 0 - 100MW
};

// Percentage validation
export const isValidPercentage = (value: number): boolean => {
  return value >= 0 && value <= 100;
};

// Export all validators
export const validators = {
  isValidEmail,
  isValidPhone,
  isValidUrl,
  isValidTcNo,
  isValidTaxNumber,
  isStrongPassword,
  isValidDate,
  isFutureDate,
  isPastDate,
  isNumeric,
  isPositiveNumber,
  isInteger,
  isValidFileType,
  isValidFileSize,
  isImageFile,
  isPdfFile,
  isExcelFile,
  isValidCoordinate,
  isInTurkey,
  isValidPowerValue,
  isValidPercentage
};
