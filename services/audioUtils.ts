/**
 * Decodes a base64 string into an AudioBuffer.
 * Note: Gemini returns raw PCM 24kHz mono/16-bit usually (or similar depending on config).
 * The web audio API needs correct handling.
 */
export const decodeBase64Audio = async (
  base64Data: string,
  audioContext: AudioContext
): Promise<AudioBuffer> => {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Determine standard sample rate for Gemini models (usually 24000Hz)
  const sampleRate = 24000;
  
  // Create an Int16 view of the data
  const int16Data = new Int16Array(bytes.buffer);
  
  // Create an AudioBuffer
  const buffer = audioContext.createBuffer(1, int16Data.length, sampleRate);
  const channelData = buffer.getChannelData(0);

  // Normalize 16-bit integer to float range [-1.0, 1.0]
  for (let i = 0; i < int16Data.length; i++) {
    channelData[i] = int16Data[i] / 32768.0;
  }

  return buffer;
};

/**
 * Creates a WAV file blob from raw PCM 16-bit data (from base64)
 * This allows the user to download the file in a standard format.
 */
export const base64ToWavBlob = (base64Data: string): Blob => {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // WAV Header parameters
  const numChannels = 1;
  const sampleRate = 24000;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = bytes.length;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM samples
  const wavBytes = new Uint8Array(buffer);
  wavBytes.set(bytes, 44);

  return new Blob([buffer], { type: 'audio/wav' });
};

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
