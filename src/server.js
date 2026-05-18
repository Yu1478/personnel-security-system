require('dotenv').config();
const app = require('./app');
const { bootstrapDemoData } = require('./init/bootstrap');

const port = Number(process.env.PORT || 3000);

bootstrapDemoData()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Bootstrap failed:', err);
    process.exit(1);
  });
