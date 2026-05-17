require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  // Server start is a placeholder; do not run automatically in this task.
  console.log(`Backend app listening on port ${PORT}`);
});
