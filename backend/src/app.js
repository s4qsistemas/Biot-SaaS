const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// --- Middleware Globales ---
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Importar Rutas ---
const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuarios.routes');
const catalogosRoutes = require('./routes/catalogos.routes');
const inventarioRoutes = require('./routes/inventario.routes');
const entidadesRoutes = require('./routes/entidades.routes');
const cotizacionesRoutes = require('./routes/cotizaciones.routes');
const ordenesTrabajoRoutes = require('./routes/ordenes_trabajo.routes');
const superAdminRoutes = require('./routes/superAdminRoutes');
// const dashboardRoutes = require('./routes/dashboard.routes');

// --- Definir Rutas ---
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/catalogos', catalogosRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/entidades', entidadesRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/ordenes-trabajo', ordenesTrabajoRoutes);
app.use('/api/superadmin', superAdminRoutes);
// app.use('/api/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Biot SaaS API is running' });
});

module.exports = app;