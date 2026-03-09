// backend/src/utils/rut.js

const cleanRut = (rut) => {
    return typeof rut === 'string'
        ? rut.replace(/[^0-9kK]/g, '').toUpperCase()
        : '';
};

const validateRut = (rut) => {
    const clean = cleanRut(rut);
    if (clean.length < 8) return false;

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);

    let suma = 0;
    let multiplicador = 2;

    for (let i = body.length - 1; i >= 0; i--) {
        suma += parseInt(body[i]) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resto = 11 - (suma % 11);
    let dvCalculado = '0';

    if (resto === 11) dvCalculado = '0';
    else if (resto === 10) dvCalculado = 'K';
    else dvCalculado = resto.toString();

    return dv === dvCalculado;
};

// 👇 ESTA ES LA MAGIA: Transforma CUALQUIER entrada en XXXXXXXX-X
const formatRutForDB = (rut) => {
    const clean = cleanRut(rut);
    if (clean.length <= 1) return clean;

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);

    return `${body}-${dv}`; // Sin separador de miles, solo el guion
};

module.exports = { cleanRut, validateRut, formatRutForDB };