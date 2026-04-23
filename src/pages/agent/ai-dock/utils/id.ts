let seq = 0;

export const createId = (prefix = 'msg') => {
  seq += 1;
  return `${prefix}_${Date.now()}_${seq}`;
};
