require('dotenv').config();
const { bootstrapDemoData } = require('../src/init/bootstrap');

bootstrapDemoData()
  .then(() => {
    console.log('Demo data reset complete.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Demo data reset failed:', err);
    process.exit(1);
  });
