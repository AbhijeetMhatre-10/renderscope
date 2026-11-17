export { detectLargeJavaScript } from './javascriptDetector';
export { detectLargeImages } from './imageDetector';
export { detectSlowResources } from './slowResourceDetector';
export { detectLargeResources } from './largeResourceDetector';
export { detectManyRequests } from './requestDetector';
export {
  DEFAULT_THRESHOLDS,
  THRESHOLD_CONFIG,
  normalizeThresholds,
  runFindingEngine,
  default,
} from './findingEngine';
