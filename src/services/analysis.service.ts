interface AnalysisInput {
  avgPrice: number;
  monthlyClients: number;
  rawMaterialPercent: number;
  monthlyRent: number;
  totalFixedCosts: number;
  variableUnitCost: number;
}

interface AnalysisResult {
  monthlySales: number;
  variableCost: number;
  fixedCost: number;
  ebitda: number;
  profitMargin: number;
  breakEvenUnits: number;
  breakEvenCurrency: number;
  healthStatus: "green" | "yellow" | "red";
  diagnosis: string;
  financialAlert: {
    isLosing: boolean;
    shortfallAmount: number;
    message: string;
  };
}

export function calculateAnalysis(input: AnalysisInput): AnalysisResult {
  const { avgPrice, monthlyClients, rawMaterialPercent, monthlyRent, totalFixedCosts, variableUnitCost } = input;

  const monthlySales = avgPrice * monthlyClients;
  const variableCost = monthlySales * (rawMaterialPercent / 100);
  const fixedCost = totalFixedCosts || monthlyRent;
  const ebitda = monthlySales - variableCost - fixedCost;
  const profitMargin = monthlySales > 0 ? (ebitda / monthlySales) * 100 : 0;

  const variableCostPerUnit = avgPrice * (rawMaterialPercent / 100);
  const contributionMargin = avgPrice - (variableUnitCost || variableCostPerUnit);
  const breakEvenUnits = contributionMargin > 0 ? Math.ceil((totalFixedCosts || monthlyRent) / contributionMargin) : 0;
  const breakEvenCurrency = breakEvenUnits * avgPrice;

  let healthStatus: "green" | "yellow" | "red";
  let diagnosis: string;

  if (profitMargin >= 20) {
    healthStatus = "green";
    diagnosis = "Margen saludable";
  } else if (profitMargin >= 0) {
    healthStatus = "yellow";
    diagnosis = "Margen ajustado";
  } else {
    healthStatus = "red";
    diagnosis = "Pérdida detectada";
  }

  const isLosing = monthlySales < breakEvenCurrency;
  const shortfallAmount = isLosing ? Math.round((breakEvenCurrency - monthlySales) * 100) / 100 : 0;
  const message = isLosing ? `⚠️ Está perdiendo dinero. Necesita $${shortfallAmount} más para cubrir costos fijos.` : "";

  return {
    monthlySales: Math.round(monthlySales * 100) / 100,
    variableCost: Math.round(variableCost * 100) / 100,
    fixedCost: Math.round(fixedCost * 100) / 100,
    ebitda: Math.round(ebitda * 100) / 100,
    profitMargin: Math.round(profitMargin * 100) / 100,
    breakEvenUnits: Math.round(breakEvenUnits),
    breakEvenCurrency: Math.round(breakEvenCurrency * 100) / 100,
    healthStatus,
    diagnosis,
    financialAlert: {
      isLosing,
      shortfallAmount,
      message,
    },
  };
}
