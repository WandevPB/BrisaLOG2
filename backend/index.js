// backend/index.js
// Dependências: express, multer, fs, path
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Persistência simples em arquivo (em produção, use banco de dados)
const DATA_FILE = path.join(__dirname, 'registros.json');
function loadRegistros() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE));
  }
  return [];
}
function saveRegistros(registros) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(registros, null, 2));
}
let registros = loadRegistros();

// Upload de foto + link
app.post('/api/upload', upload.single('foto'), (req, res) => {
  const fotoPath = req.file ? `/backend/uploads/${req.file.filename}` : null;
  const link = req.body.link;
  registros.push({ foto: fotoPath, link });
  saveRegistros(registros);
  res.json({ success: true });
});

// Login admin
app.get('/admin999', (req, res) => {
  // Acesso livre, sem login
  let html = '<h1>Fotos e Links Gerados</h1><div style="display:flex;flex-wrap:wrap;">';
  registros.forEach(r => {
    html += `<div style="margin:10px;">
      ${r.foto ? `<img src="${r.foto}" style="max-width:200px;display:block;">` : ''}
      <a href="${r.link}" target="_blank">${r.link}</a>
    </div>`;
  });
  html += '</div>';
  res.send(html);
});

// Servir fotos
app.use('/backend/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(9999, () => console.log('Server running on http://localhost:9999'));
