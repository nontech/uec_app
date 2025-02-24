const { withInfoPlist } = require('expo/config-plugins');

const withTrackingTransparency = (config) => {
  return withInfoPlist(config, (config) => {
    const infoPlist = config.modResults;

    // Ensure NSUserTrackingUsageDescription is set
    if (!infoPlist.NSUserTrackingUsageDescription) {
      infoPlist.NSUserTrackingUsageDescription =
        'This identifier will be used to identify you in our system.';
    }

    return config;
  });
};

module.exports = withTrackingTransparency;
