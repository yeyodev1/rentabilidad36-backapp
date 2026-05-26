import { OnboardingProgress } from "../models/OnboardingProgress.model";

interface OnboardingData {
  step1?: { legalName: string; commercialName: string; ruc: string; country: string; city: string };
  step2?: { name: string; address: string; phone: string };
  step3?: { cocina: Array<{ dayOfWeek: number; openTime: string; closeTime: string }>; atencion: Array<{ dayOfWeek: number; openTime: string; closeTime: string }> };
  step4?: Array<{ name: string; sellingPrice: number; ingredients: Array<{ ingredientId: string; quantity: number }> }>;
  step5?: Array<{ name: string; unitOfMeasure: string; costPrice: number; wastePercentage: number }>;
  step6?: Array<{ name: string; brand: string; purchaseDate: string; historicalCost: number; usefulLife: number; maintenanceIntervalDays: number }>;
  step7?: { rent: number; payroll: number; utilities: number; insurance: number; marketing: number; other: number };
  step8?: { provider: string; apiKey: string; webhookUrl: string };
  step9?: { whatsappEnabled: boolean; emailEnabled: boolean; pushEnabled: boolean; whatsappNumber: string; emailAddress: string };
  step10?: { completed: boolean };
}

export async function saveStep(userId: string, step: number, data: object): Promise<void> {
  const stepKey = `step${step}`;

  await OnboardingProgress.findOneAndUpdate(
    { userId },
    {
      $set: {
        [`data.${stepKey}`]: data,
      },
      $max: { currentStep: step + 1 },
      $addToSet: { completedSteps: step },
    },
    { upsert: true, new: true }
  );
}

export async function getProgress(userId: string): Promise<typeof OnboardingProgress.prototype | null> {
  return OnboardingProgress.findOne({ userId });
}

export async function completeOnboarding(userId: string): Promise<void> {
  await OnboardingProgress.findOneAndUpdate(
    { userId },
    { $set: { isComplete: true } }
  );
}

export async function resetOnboarding(userId: string): Promise<void> {
  await OnboardingProgress.findOneAndDelete({ userId });
}
