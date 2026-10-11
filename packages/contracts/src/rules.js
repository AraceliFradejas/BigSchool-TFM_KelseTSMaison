export const categories = ['fashion', 'accessories', 'beauty'];
export const orderStatuses = ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'];
export const transitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['dispatched', 'cancelled'],
  dispatched: ['delivered'],
  delivered: [],
  cancelled: [],
};
