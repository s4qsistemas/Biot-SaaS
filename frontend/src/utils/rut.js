// Elimina puntos y guiones, y deja la K mayúscula
export const cleanRut = (rut) => {
    return typeof rut === 'string'
        ? rut.replace(/[^0-9kK]/g, '').toUpperCase()
        : '';
};

// Formatea: 123456789 -> 12.345.678-9
export const formatRut = (rut) => {
    const clean = cleanRut(rut);
    if (clean.length <= 1) return clean;

    const body = clean.slice(0, -1);
    const dv = clean.slice(-1);

    return `${Number(body).toLocaleString('es-CL')}-${dv}`;
};

// Algoritmo Módulo 11 (Estándar chileno)
export const validateRut = (rut) => {
    const clean = cleanRut(rut);
    if (clean.length < 8) return false; // Mínimo 1.000.000-X

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