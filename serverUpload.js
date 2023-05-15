import fs from 'node:fs';
import multer from 'multer';
import express from 'express';
import { parse } from 'csv-parse';

const app = express();

app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, 'tasks.csv')
  }
});

const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  // Lê o arquivo CSV usando o 'csv-parser'
  fs.createReadStream('./uploads/tasks.csv')
    .pipe(
      parse({ delimiter: ",", from_line: 2 }) // pula a primeira linha
    )
    .on('data', (row) => {
      // Processa cada linha do arquivo CSV
      console.log(row);
    })
    .on('end', () => {
      // Remove o arquivo da pasta após ser lido
      fs.unlinkSync('./uploads/tasks.csv');

      // Executado quando todo o arquivo CSV foi lido
      res.send('Arquivo CSV lido com sucesso.');
    });
});

app.listen(3000, () => {
  console.log('Servidor escutando na porta 3000');
});
