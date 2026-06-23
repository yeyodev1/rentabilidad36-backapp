import sharp from "sharp";

interface OcrResult {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  blurry?: boolean;
  confidence: number;
}

export async function processChecklistImage(imagePath: string): Promise<OcrResult> {
  return processChecklistImageBuffer(await sharp(imagePath).toBuffer());
}

export async function processChecklistImageBuffer(imageBuffer: Buffer): Promise<OcrResult> {
  try {
    const metadata = await sharp(imageBuffer).metadata();

    const stats = await sharp(imageBuffer)
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = stats.data;
    let sum = 0;
    for (let i = 0; i < pixels.length; i++) {
      sum += pixels[i];
    }
    const mean = sum / pixels.length;

    let varianceSum = 0;
    for (let i = 0; i < pixels.length; i++) {
      varianceSum += Math.pow(pixels[i] - mean, 2);
    }
    const variance = varianceSum / pixels.length;
    const stdDev = Math.sqrt(variance);

    const isBlurry = stdDev < 40;

    if (isBlurry) {
      return {
        success: false,
        blurry: true,
        error: "Imagen borrosa o ilegible. Por favor, tome una foto más clara.",
        confidence: 0,
      };
    }

    const extractedData: Record<string, any> = {
      imageWidth: metadata.width,
      imageHeight: metadata.height,
      format: metadata.format,
      detectedText: "Simulación OCR - texto extraído correctamente",
      items: [
        { label: "Encender equipos", detected: "Sí" },
        { label: "Verificar temperatura", detected: "24°C" },
        { label: "Estado del piso", detected: "Limpio" },
      ],
      processedAt: new Date().toISOString(),
    };

    const confidence = Math.min(Math.round((stdDev / 100) * 100), 95);

    return {
      success: true,
      data: extractedData,
      confidence,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Error al procesar la imagen: ${error.message}`,
      confidence: 0,
    };
  }
}
