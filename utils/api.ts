export type DivinationRequest = {
  n1: number;
  n2: number;
  n3: number;
  question: string;
  locale: string;
};

export type DivinationResponse = {
  lowerTrigram: string;
  upperTrigram: string;
  hexagramName: string;
  changingLine: number;
  explanation: {
    plain: string;
    tips: string[];
  };
  debug?: {
    mod8_n1: number;
    mod8_n2: number;
    mod6_n3: number;
  };
};

export type ErrorResponse = { 
  error: string;
  message?: string;
};

export async function postDivination(body: DivinationRequest, signal?: AbortSignal): Promise<DivinationResponse> {
  const started = Date.now();
  console.log("[api] Starting divination with backend API", body);
  
  // 確保中文回答的請求體
  const requestBody = {
    ...body,
    // 在問題前加入明確的中文指示
    question: `請務必使用繁體中文回答，不要使用英文。問題：${body.question}`,
    locale: "zh-TW",
    // 加入額外的語言指示參數
    language: "zh-TW",
    responseLanguage: "traditional-chinese"
  };
  
  try {
    const res = await fetch("https://curly-butterfly-895b.stevenyu-supreme.workers.dev/api/divination", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal,
    });
    
    const duration = Date.now() - started;
    
    if (!res.ok) {
      console.log("[api] Backend API failed", res.status, "in", duration, "ms");
      let errorMessage = "服務暫時無法使用，請稍後再試";
      try {
        const errorData = await res.json() as ErrorResponse;
        if (errorData.error === "DEEPSEEK_402") {
          errorMessage = errorData.message || "服務餘額不足，請稍後再試或聯絡開發者";
        } else {
          errorMessage = errorData.message || errorMessage;
        }
      } catch {}
      throw new Error(errorMessage);
    }
    
    const result = (await res.json()) as DivinationResponse;
    
    console.log("[api] Backend divination success in", duration, "ms");
    return result;
    
  } catch (error) {
    const duration = Date.now() - started;
    console.log("[api] Backend divination error in", duration, "ms", error);
    throw error;
  }
}