const QRCode = require('qrcode');

const generateQRCode = async (data) => {
  try {
    const qrDataURL = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#3B2118',
        light: '#FFF8EE',
      },
    });
    return qrDataURL;
  } catch (error) {
    throw new Error('QR Code generation failed: ' + error.message);
  }
};

module.exports = { generateQRCode };
