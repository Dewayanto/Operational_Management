
import { FunctionDeclaration, Type } from "@google/genai";
import { AppLevel } from "./types";

export const SYSTEM_INSTRUCTION_BASE = `
**NAMA APLIKASI:** DEWAYANTO OPERATIONS MANAGEMENT (AI Voice Agent)

### 1. Persona dan Atribut Dasar
**Role Identity:** Anda adalah Profesor ahli Manajemen Operasional dan Konsultan Strategis (Prof. Dewayanto). 
**Primary Goal:** Bertindak sebagai Decision Support System (DSS) yang cerdas. Menerjemahkan data menjadi wawasan visual.
**Output Protocol:**
1. Selalu uji asumsi pengguna.
2. Kaitkan rekomendasi dengan Performance Objectives (Cost, Quality, Speed, Dependability, Flexibility).

### 2. Visualization & Infographics
Anda memiliki kemampuan untuk mengubah data percakapan atau dokumen menjadi Infografik Visual yang menarik.
- **KAPAN MENGGUNAKANNYA:** Setiap kali Anda menyimpulkan data, mengusulkan perbaikan proses, atau menghitung metrik, PANGGIL tool \`updateInfographic\`.
- Jangan hanya bicara angka; tunjukkan dalam grafik atau kartu metrik.
- Jika pengguna mengupload dokumen, sistem akan otomatis membuat infografik awal. Tugas Anda adalah memperbaruinya seiring diskusi mendalam.

### 3. Capability Levels
**BASIC:** Definisi & Konsep. Visualisasi sederhana.
**INTERMEDIATE:** Analisis Proses & Hitungan (Inventory, Capacity). Visualisasi flow & chart.
**ADVANCED:** Strategi & Risiko (Six Sigma). Visualisasi kompleks.
`;

export const getSystemInstruction = (level: AppLevel) => {
  return `${SYSTEM_INSTRUCTION_BASE}\n\n**LEVEL:** ${level}.`;
};

// Tool Definitions for Function Calling
export const toolsDeclarations: FunctionDeclaration[] = [
  {
    name: "updateInfographic",
    description: "Update the interactive infographic screen to visualize the current context, data, process flow, or metrics discussed.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: "Main title for the visual report" },
        summary: { type: Type.STRING, description: "Executive summary text (max 3 sentences)" },
        metrics: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              value: { type: Type.STRING },
              trend: { type: Type.STRING, enum: ['up', 'down', 'neutral'] }
            }
          }
        },
        processFlow: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              step: { type: Type.STRING, description: "Short step name" },
              description: { type: Type.STRING, description: "Details of the step" }
            }
          }
        },
        chartTitle: { type: Type.STRING, description: "Title for the bar chart" },
        chartData: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Category name" },
              value: { type: Type.NUMBER, description: "Numeric value" }
            }
          }
        }
      },
      required: ["title", "summary", "metrics"]
    },
  },
];
