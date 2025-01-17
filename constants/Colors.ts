export default {
  // Primary Background Colors
  background: {
    primary: '#FFFFFF', // Main app background
    secondary: '#F5F5F5', // Secondary elements (inputs, headers)
    tertiary: '#007AFF', // Buttons, borders
  },

  // Text Colors
  text: {
    primary: '#000000', // Primary text
    secondary: 'rgba(0, 0, 0, 0.8)', // Secondary text
    placeholder: '#757575', // Placeholder text
  },

  // Border Colors
  border: {
    primary: '#E0E0E0',
    secondary: '#EEEEEE',
  },

  // Overlay Colors
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Status Colors
  status: {
    success: '#34C759',
    error: '#FF3B30',
    warning: '#FF9500',
    info: '#007AFF',
  },

  // Shadow
  shadow: {
    color: '#000000',
    opacity: 0.1,
  },
} as const;
