export interface EnrollState {
  error: string | null;
  factorId: string | null;
  qr: string | null;
  secret: string | null;
}

export interface VerifyState {
  error: string | null;
}

export const initialEnrollState: EnrollState = {
  error: null,
  factorId: null,
  qr: null,
  secret: null,
};

export const initialVerifyState: VerifyState = { error: null };
