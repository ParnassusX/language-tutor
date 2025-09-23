// AudioWorklet processor for handling audio streaming
class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.sampleRate = 16000;
    this.port.onmessage = (event) => {
      // Handle messages from the main thread if needed
      if (event.data.type === 'start') {
        this.isActive = true;
      } else if (event.data.type === 'stop') {
        this.isActive = false;
      }
    };
    this.isActive = false;
  }

  process(inputs, outputs, parameters) {
    if (!this.isActive) return true;
    
    const input = inputs[0];
    if (input.length > 0) {
      const inputData = input[0];
      
      // Convert float32 to int16
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
      }
      
      // Send audio data to main thread
      this.port.postMessage(pcmData.buffer, [pcmData.buffer]);
    }
    
    return true;
  }
}

// Register the processor
registerProcessor('audio-processor', AudioProcessor);
