let mockIdCounter = 0;

export const v4 = jest.fn(() => {
  mockIdCounter++;
  return `mock-uuid-${mockIdCounter.toString().padStart(8, '0')}-4444-4444-4444-123456789abc`;
});

export default {
  v4,
};