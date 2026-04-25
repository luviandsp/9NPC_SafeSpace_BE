import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import appRoutes from './routes/index';
import { z, ZodError } from 'zod';

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins: string[] = [];

// Untuk production, hanya izinkan URL frontend dari environment variable.
if (process.env.NODE_ENV === 'production') {
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  } else {
    // Beri peringatan di konsol jika FRONTEND_URL tidak di-set saat production.
    console.warn(
      'PERINGATAN: FRONTEND_URL tidak diatur di environment production. Permintaan dari frontend mungkin akan diblokir oleh CORS.',
    );
  }
} else {
  // Untuk development, izinkan beberapa origin umum seperti localhost.
  allowedOrigins.push('http://localhost:5173');
  allowedOrigins.push('http://localhost:3001');
  allowedOrigins.push('http://localhost:3000');
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Tidak diizinkan oleh kebijakan CORS'));
    }
  },
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('API is running...');
});

app.use('/api', appRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error tertangkap di Global Handler:', err);

  if (err instanceof ZodError) {
    const flattened = z.flattenError(err);

    return res.status(400).json({
      success: false,
      message: 'Input tidak valid',
      errors: flattened.fieldErrors,
    });
  }

  const statusCode = err.status || 500;
  const message = err.message || 'Terjadi kesalahan pada server';

  res.status(statusCode).json({
    error: message,
    // (Opsional) Tampilkan stack trace hanya saat development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
