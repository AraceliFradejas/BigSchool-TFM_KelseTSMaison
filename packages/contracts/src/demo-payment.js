import { z } from 'zod';
export const demoPaymentMethods = ['bank', 'card', 'paypal', 'apple_pay', 'samsung_pay'];
export const demoPaymentSchema = z
  .object({
    mode: z.literal('demo'),
    method: z.enum(demoPaymentMethods),
    acknowledged: z.literal(true),
    outcome: z.enum(['approved', 'declined']).default('approved'),
  })
  .strict();
export const paymentCopy = {
  es: {
    title: 'Revisar y simular el pago',
    review: 'Continuar al pago simulado',
    warning:
      'Simulación de un proyecto académico: no estás comprando nada y no se realizará ningún cargo.',
    details:
      'Ningún método está conectado a una cuenta, tarjeta o pasarela real. No introduzcas datos bancarios.',
    consent: 'Entiendo que es una simulación y que no estoy realizando una compra real.',
    confirm: 'Confirmar pago simulado',
    cancel: 'Volver a la bolsa',
    working: 'Registrando pedido de demostración…',
    method: 'Método ficticio',
    bank: 'Cuenta bancaria ficticia',
    card: 'Tarjeta de crédito ficticia',
    paypal: 'PayPal simulado',
    apple_pay: 'Apple Pay simulado',
    samsung_pay: 'Samsung Pay simulado',
    test: 'Escenario de demostración',
    approved: 'Simular pago aceptado',
    declined: 'Simular pago rechazado',
    success: '¡Pedido de demostración realizado!',
    receipt: 'Justificante de pago simulado',
    noCharge: 'Cargo real: 0,00 €. No se ha comprado ni enviado ningún producto.',
    reference: 'Referencia de simulación',
    amount: 'Importe simulado',
    pending: 'Pedido pendiente de preparación en Team',
    price_changed:
      'El importe ha cambiado. Vuelve a la bolsa, actualiza los precios y revisa el total antes de confirmar.',
    demo_payment_declined:
      'Pago ficticio rechazado. No se ha creado ningún pedido ni descontado stock. Puedes probar otra vez.',
  },
  en: {
    title: 'Review and simulate payment',
    review: 'Continue to simulated payment',
    warning: 'Academic project simulation: you are not buying anything and no charge will be made.',
    details:
      'No method is connected to a real bank account, card or payment gateway. Do not enter banking details.',
    consent: 'I understand this is a simulation and I am not making a real purchase.',
    confirm: 'Confirm simulated payment',
    cancel: 'Back to bag',
    working: 'Recording demonstration order…',
    method: 'Fictional method',
    bank: 'Fictional bank account',
    card: 'Fictional credit card',
    paypal: 'Simulated PayPal',
    apple_pay: 'Simulated Apple Pay',
    samsung_pay: 'Simulated Samsung Pay',
    test: 'Demonstration scenario',
    approved: 'Simulate accepted payment',
    declined: 'Simulate declined payment',
    success: 'Demonstration order completed!',
    receipt: 'Simulated payment receipt',
    noCharge: 'Real charge: 0,00 €. No products have been purchased or shipped.',
    reference: 'Simulation reference',
    amount: 'Simulated amount',
    pending: 'Order awaiting preparation in Team',
    price_changed:
      'The amount has changed. Return to your bag, refresh prices and review the total before confirming.',
    demo_payment_declined:
      'Fictional payment declined. No order was created and stock was not changed. You can try again.',
  },
};
