interface AnalysisInput {
  avgPrice: number;
  monthlyClients: number;
  rawMaterialPercent: number;
  monthlyRent: number;
}

interface AnalysisResult {
  monthlySales: number;
  variableCost: number;
  fixedCost: number;
  ebitda: number;
  profitMargin: number;
  breakEvenClients: number;
  healthStatus: "green" | "yellow" | "red";
  diagnosis: string;
}

export function calculateAnalysis(input: AnalysisInput): AnalysisResult {
  const { avgPrice, monthlyClients, rawMaterialPercent, monthlyRent } = input;

  const monthlySales = avgPrice * monthlyClients;
  const variableCost = monthlySales * (rawMaterialPercent / 100);
  const fixedCost = monthlyRent;
  const ebitda = monthlySales - variableCost - fixedCost;
  const profitMargin = monthlySales > 0 ? (ebitda / monthlySales) * 100 : 0;

  const variableCostPerUnit = avgPrice * (rawMaterialPercent / 100);
  const contributionMargin = avgPrice - variableCostPerUnit;
  const breakEvenClients =
    contributionMargin > 0 ? Math.ceil(monthlyRent / contributionMargin) : Infinity;

  let healthStatus: "green" | "yellow" | "red";
  let diagnosis: string;

  if (profitMargin >= 20) {
    healthStatus = "green";
    diagnosis =
      "¡EBITDA Saludable detectado! Tu negocio tiene un margen sólido y capacidad de crecimiento.";
  } else if (profitMargin >= 0) {
    healthStatus = "yellow";
    diagnosis =
      "Riesgo financiero: Tus costos fijos son muy altos para el volumen de ventas proyectado. Revisa tu estructura de costos.";
  } else {
    healthStatus = "red";
    diagnosis =
      "Tu negocio no es rentable con los costos actuales. Necesitas aumentar precios, reducir costos o mejorar el volumen de ventas.";
  }

  return {
    monthlySales: Math.round(monthlySales * 100) / 100,
    variableCost: Math.round(variableCost * 100) / 100,
    fixedCost: Math.round(fixedCost * 100) / 100,
    ebitda: Math.round(ebitda * 100) / 100,
    profitMargin: Math.round(profitMargin * 100) / 100,
    breakEvenClients:
      breakEvenClients === Infinity ? 0 : Math.round(breakEvenClients),
    healthStatus,
    diagnosis,
  };
}
