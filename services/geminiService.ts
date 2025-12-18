
import { GoogleGenAI } from "@google/genai";

// Fix: Updated to handle InventoryItem array instead of spreadsheet GridData to match App.tsx data structure
export const getAIAnalysis = async (items: any[], prompt: string) => {
  // Fix: Initializing GoogleGenAI with the mandatory apiKey named parameter
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Agrega dados do estoque para o contexto da IA formatando os itens da lista
  const tableData = items
    .map(item => `${item.code} (${item.description}): Entrada ${item.entry}, Saída ${item.exit}, Saldo ${item.entry - item.exit}`)
    .join("; ");

  const systemInstruction = `Você é o Assistente de Inteligência Logística do Grupo Newcom.
  Especialista em SST (Segurança e Saúde no Trabalho) e controle de sinalização industrial conforme NR-26.
  
  CONTEXTO ATUAL DO ESTOQUE: ${tableData}.
  
  Suas diretrizes:
  1. Forneça análises sobre níveis críticos de estoque de placas.
  2. Responda dúvidas técnicas sobre as cores e formas da NR-26 (ex: Vermelho = Proibição, Amarelo = Alerta, Verde = Segurança).
  3. Seja conciso, profissional e use um tom de autoridade técnica.
  4. Ajude o usuário a tomar decisões baseadas nos dados de entrada e saída.
  5. Identifique padrões de consumo se houver dados históricos.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.4,
      },
    });

    // Fix: Access response.text property directly as per latest @google/genai SDK guidelines (do not use text() method)
    return response.text || "O assistente não gerou uma resposta válida.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Desculpe, tive um problema ao acessar os servidores centrais da Newcom IA. Por favor, tente novamente mais tarde.";
  }
};
