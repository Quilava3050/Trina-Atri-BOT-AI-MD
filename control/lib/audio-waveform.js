import decode from "audio-decode";

export async function generateWaveform(buffer) {
  const audioBuffer = await decode(buffer);
  const frameCount = audioBuffer.length;
  const channelCount = audioBuffer.numberOfChannels;
  const sampleCount = 64;

  if (!frameCount || !channelCount) {
    throw new Error("Audio tidak memiliki sampel yang dapat dibuat waveform.");
  }

  const channels = Array.from({ length: channelCount }, (_, channel) => audioBuffer.getChannelData(channel));
  const amplitudes = new Float64Array(sampleCount);
  let maxAmplitude = 0;

  for (let i = 0; i < sampleCount; i++) {
    const start = Math.floor((i * frameCount) / sampleCount);
    const end = Math.floor(((i + 1) * frameCount) / sampleCount);
    let amplitudeSum = 0;
    let valueCount = 0;

    for (let frame = start; frame < end; frame++) {
      for (const channel of channels) {
        const value = channel[frame];
        if (!Number.isFinite(value)) continue;
        amplitudeSum += Math.abs(value);
        valueCount++;
      }
    }

    if (valueCount > 0) {
      amplitudes[i] = amplitudeSum / valueCount;
      maxAmplitude = Math.max(maxAmplitude, amplitudes[i]);
    }
  }

  const waveform = new Uint8Array(sampleCount);
  if (maxAmplitude === 0) return waveform;

  for (let i = 0; i < sampleCount; i++) {
    waveform[i] = Math.min(100, Math.round((amplitudes[i] / maxAmplitude) * 100));
  }

  return waveform;
}
