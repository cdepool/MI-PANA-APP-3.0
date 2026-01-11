// Re-export everything from the new services to maintain backward compatibility during refactor

// Re-export pricing service with aliases for backward compatibility
export {
  currentBcvRate as mockBcvRate,
  lastBcvUpdate as mockBcvLastUpdate,
  fetchBcvRate,
  getTariffs,
  SERVICE_CATALOG,
  calculateLiquidation,
  calculatePrice,
  round2,
  roundMoney
} from './pricingService';

// Re-export simulation service
export * from './simulationService';
