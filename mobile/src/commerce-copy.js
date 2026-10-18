import { paymentCopy } from '@maison/contracts/demo-payment';
export const accountCopy = {
  es: {
    account: 'Mi cuenta',
    login: 'Acceder',
    register: 'Crear cuenta',
    name: 'Nombre',
    email: 'Correo electrónico',
    password: 'Contraseña',
    logout: 'Cerrar sesión',
    orders: 'Mis pedidos',
    messages: 'Mis comunicaciones',
    empty: 'Todavía no tienes pedidos de demostración.',
    noMessages: 'Todavía no tienes comunicaciones.',
    help: 'Utiliza un correo ficticio y una contraseña propia de al menos 10 caracteres. No se envían correos externos.',
    retry: 'Reintentar',
    loading: 'Cargando…',
    detail: 'Detalle del pedido',
    back: 'Volver',
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    dispatched: 'Enviado (simulación)',
    delivered: 'Entregado (simulación)',
    cancelled: 'Cancelado',
    continue: 'Accede para continuar con tu bolsa',
    errors: {
      storage_unavailable:
        'No se puede guardar el intento en este dispositivo. Reintenta antes de confirmar.',
      invalid_credentials: 'Revisa el correo y la contraseña.',
      email_exists: 'Ya existe una cuenta con ese correo.',
      invalid_input: 'Revisa los datos y sus límites.',
      authentication_required: 'Accede a tu cuenta para continuar.',
      session_unavailable:
        'No hemos podido verificar la sesión del dispositivo. Vuelve a intentarlo.',
      insufficient_stock: 'Han cambiado las existencias. Revisa tu bolsa.',
      product_unavailable: 'Una pieza ya no está disponible.',
      idempotency_conflict:
        'Este intento ya tiene otro contenido. Consulta tus pedidos antes de volver a intentarlo.',
      rate_limited: 'Demasiados intentos. Espera un momento.',
      network_error: 'No se ha podido conectar. Comprueba tu conexión y vuelve a intentarlo.',
      error: 'No se ha podido completar la acción. Vuelve a intentarlo.',
    },
  },
  en: {
    account: 'My account',
    login: 'Sign in',
    register: 'Create account',
    name: 'Name',
    email: 'Email',
    password: 'Password',
    logout: 'Sign out',
    orders: 'My orders',
    messages: 'My messages',
    empty: 'You have no demonstration orders yet.',
    noMessages: 'You have no messages yet.',
    help: 'Use a fictional email and your own password of at least 10 characters. No external emails are sent.',
    retry: 'Retry',
    loading: 'Loading…',
    detail: 'Order details',
    back: 'Back',
    pending: 'Pending',
    confirmed: 'Confirmed',
    dispatched: 'Dispatched (simulation)',
    delivered: 'Delivered (simulation)',
    cancelled: 'Cancelled',
    continue: 'Sign in to continue with your bag',
    errors: {
      storage_unavailable: 'Cannot save this attempt on your device. Retry before confirming.',
      invalid_credentials: 'Check your email and password.',
      email_exists: 'An account already exists with that email.',
      invalid_input: 'Check the fields and their limits.',
      authentication_required: 'Sign in to continue.',
      session_unavailable: 'We could not verify the session on this device. Please try again.',
      insufficient_stock: 'Availability has changed. Review your bag.',
      product_unavailable: 'A piece is no longer available.',
      idempotency_conflict:
        'This attempt already has different content. Check your orders before trying again.',
      rate_limited: 'Too many attempts. Wait a moment.',
      network_error: 'Could not connect. Check your connection and try again.',
      error: 'The action could not be completed. Try again.',
    },
  },
};
export function commerceError(error, language) {
  const key = error?.code || error?.message;
  return (
    paymentCopy[language][key] ||
    accountCopy[language].errors[key] ||
    accountCopy[language].errors.error
  );
}
