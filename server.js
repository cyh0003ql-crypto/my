const express = require('express');
const path = require('path');

const app = express();
const PORT = 5000;

app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Petit Aura Mall running at http://0.0.0.0:${PORT}`);
});
