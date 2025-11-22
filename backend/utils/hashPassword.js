// Utility để tạo hash password cho admin
const bcrypt = require('bcryptjs');

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log('Password:', password);
  console.log('Hash:', hash);
  return hash;
}

// Chạy: node backend/utils/hashPassword.js
if (require.main === module) {
  hashPassword('Admin@123').then(() => process.exit(0));
}

module.exports = { hashPassword };

