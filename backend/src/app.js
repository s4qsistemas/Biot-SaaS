const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// --- Middleware Globales ---
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- Importar Rutas ---
const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuarios.routes');
const catalogosRoutes = require('./routes/catalogos.routes');
const inventarioRoutes = require('./routes/inventario.routes');
const entidadesRoutes = require('./routes/entidades.routes');
const cotizacionesRoutes = require('./routes/cotizaciones.routes');
const ordenesTrabajoRoutes = require('./routes/ordenes_trabajo.routes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const dashboardRoutes = require('./routes/dashboard.routes');
const navesRoutes = require('./routes/naves.routes');
const configuracionRoutes = require('./routes/configuracion.routes');

// --- Importar Middleware de Jaula ---
const checkPasswordChange = require('./middleware/checkPasswordChange');
const { authenticate } = require('./middleware/authMiddleware');

// --- Definir Rutas Exentas ---
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);

// --- Definir Rutas Protegidas (Autenticación Global) ---
app.use('/api/usuarios', authenticate, checkPasswordChange, usuariosRoutes);
app.use('/api/catalogos', authenticate, checkPasswordChange, catalogosRoutes);
app.use('/api/inventario', authenticate, checkPasswordChange, inventarioRoutes);
app.use('/api/entidades', authenticate, checkPasswordChange, entidadesRoutes);
app.use('/api/cotizaciones', authenticate, checkPasswordChange, cotizacionesRoutes);
app.use('/api/ordenes-trabajo', authenticate, checkPasswordChange, ordenesTrabajoRoutes);
app.use('/api/superadmin', authenticate, checkPasswordChange, superAdminRoutes);
app.use('/api/dashboard', authenticate, checkPasswordChange, dashboardRoutes);
app.use('/api/naves', authenticate, checkPasswordChange, navesRoutes);
app.use('/api/configuracion', authenticate, checkPasswordChange, configuracionRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Biot SaaS API is running' });
});

module.exports = app;