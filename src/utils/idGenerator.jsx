let segmentIdCounter = 1;

export const generateSegmentId = () => {
  return `${segmentIdCounter++}`;
};