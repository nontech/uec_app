export default {
  // Primary Background Colors
  background: {
    primary: '#1C1C1E', // Main app background
    secondary: '#2C2C2E', // Secondary elements (inputs, headers)
    tertiary: '#3C3C3E', // Buttons, borders
  },

  // Text Colors
  text: {
    primary: '#FFFFFF', // Primary text
    secondary: 'rgba(255, 255, 255, 0.9)', // Secondary text
    placeholder: '#999999', // Placeholder text
  },

  // Border Colors
  border: {
    primary: '#2C2C2E',
    secondary: '#3C3C3E',
  },

  // Overlay Colors
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Status Colors
  status: {
    success: '#4CAF50',
    error: '#FF453A',
    warning: '#FF9F0A',
    info: '#0A84FF',
  },

  // Shadow
  shadow: {
    color: '#000000',
    opacity: 0.25,
  },
} as const;
