import { GoogleGenAI, Modality } from "@google/genai";

const getClient = (customKey?: string) => {
    const apiKey = customKey || process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key is missing. Please enter your API Key in Settings.");
    }
    return new GoogleGenAI({ apiKey: apiKey });
};

export const extractTextFromDocument = async (
    fileBase64: string, 
    mimeType: string, 
    customKey?: string
): Promise<string> => {
    const ai = getClient(customKey);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { mimeType: mimeType, data: fileBase64 } },
                { text: "Extract all the text from this document. Return ONLY the extracted text." }
            ]
        }
    });
    return response.text?.trim() || "";
}

export const translateText = async (text: string, targetLanguage: string, customKey?: string): Promise<string> => {
    const ai = getClient(customKey);
    const prompt = `Translate the following text into ${targetLanguage}. Return ONLY the translated text without any explanation, markdown, or quotes: "${text}"`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text?.trim() || "";
};

export const generateSpeech = async (text: string, voiceName: string, customKey?: string, isConversation: boolean = false): Promise<string> => {
    const ai = getClient(customKey);
    
    let speechConfig: any;

    if (isConversation) {
        // Multi-speaker configuration
        // We assume 2 speakers: A (Male/Fenrir) and B (Female/Kore)
        speechConfig = {
            multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                    { speaker: 'A', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
                    { speaker: 'B', voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
                ]
            }
        };
    } else {
        // Single speaker configuration
        speechConfig = {
            voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voiceName },
            },
        };
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: speechConfig,
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data generated.");
    }
    return base64Audio;
};