import express from 'express';
import cors from 'cors';
import { initDatabase } from './db';
import { requireAuth, requireAdmin } from './auth';
import { login, getCurrentUser, changePassword } from './controllers/authController';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  saveSession,
  parseExcelAssessment,
  importExcelAssessment
} from './controllers/studentController';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser
} from './controllers/userController';
import {
  getRequests,
  createRequest,
  approveRequest,
  rejectRequest
} from './controllers/requestController';
import {
  exportDocxReport,
  exportXlsmReport
} from './controllers/reportController';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize SQLite database
initDatabase();

// Auth routes
app.post('/api/auth/login', login);
app.get('/api/auth/me', requireAuth, getCurrentUser);
app.post('/api/auth/change-password', requireAuth, changePassword);

// Students routes
app.get('/api/students', requireAuth, getStudents);
app.get('/api/students/:id', requireAuth, getStudentById);
app.post('/api/students', requireAdmin, createStudent);
app.put('/api/students/:id', requireAdmin, updateStudent);
app.delete('/api/students/:id', requireAdmin, deleteStudent);
app.post('/api/students/:id/sessions', requireAuth, saveSession);

// Excel assessment import routes
app.post('/api/students/parse-excel', requireAuth, parseExcelAssessment);
app.post('/api/students/import-excel', requireAuth, importExcelAssessment);
app.post('/api/students/:id/import-excel', requireAuth, importExcelAssessment);

// Users routes (Admin only)
app.get('/api/users', requireAdmin, getUsers);
app.post('/api/users', requireAdmin, createUser);
app.put('/api/users/:id', requireAdmin, updateUser);
app.delete('/api/users/:id', requireAdmin, deleteUser);

// Student change requests routes
app.get('/api/requests', requireAuth, getRequests);
app.post('/api/requests', requireAuth, createRequest);
app.post('/api/requests/:id/approve', requireAdmin, approveRequest);
app.post('/api/requests/:id/reject', requireAdmin, rejectRequest);

// Report export routes
app.get('/api/reports/docx/:studentId', requireAuth, exportDocxReport);
app.get('/api/reports/xlsm/:studentId', requireAuth, exportXlsmReport);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`KidKid Backend Server is running on http://localhost:${PORT}`);
});
