export class HttpError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}
export function parse(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, 'invalid_input');
  return result.data;
}
export const send = (res, data, status = 200) => res.status(status).json({ success: true, data });
