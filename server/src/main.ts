import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'cuemate-server',
    date: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(`CueMate server listening on http://localhost:${port}`);
});
