<script lang="ts">
  let isListening = false;
  let isLoading = false;
  let statusMessage = '';
  let error = '';
  let germanText = '';
  let selectedTopic = 'General Conversation';
  let hasConversationStarted = false;
  let englishResponse = '';
  let germanTranslation = '';
  let languageTip = '';
  let mediaRecorder: MediaRecorder | null = null;

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function clearHistory() {
    const response = await fetch('/api/transcribe', {
      method: 'POST',
      headers: {
        'X-Action': 'clear'
      }
    });
    if (response.ok) {
      germanText = '';
      englishResponse = '';
      germanTranslation = '';
      languageTip = '';
    } else {
      console.error('Failed to clear history.');
    }
  }

  async function startConversation() {
    error = '';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        isLoading = true;
        statusMessage = 'Transcribing audio...';
        try {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const response = await fetch('/api/transcribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ audio: await blobToBase64(audioBlob), topic: selectedTopic })
          });

          if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.message || 'Failed to transcribe audio.');
          }

          const result = await response.json();
          console.log('Server response:', result);
          hasConversationStarted = true;
          germanText = result.transcription;
          englishResponse = result.englishText;
          germanTranslation = result.germanTranslation;
          languageTip = result.languageTip;

          statusMessage = 'Generating audio response...';
          const audioResponse = await fetch('/api/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: englishResponse })
          });

          if (!audioResponse.ok) {
            throw new Error('Failed to fetch audio for the response.');
          }

          const responseAudioBlob = await audioResponse.blob();
          const audioUrl = URL.createObjectURL(responseAudioBlob);
          const audio = new Audio(audioUrl);
          audio.play();
          audio.onended = () => {
            isLoading = false;
            statusMessage = '';
          };
        } catch (err) {
          const e = err as Error;
          console.error(e.message);
          error = e.message;
          isLoading = false;
          statusMessage = '';
        }
      };

      mediaRecorder.start();
      console.log('MediaRecorder started');
      isListening = true;
    } catch (err) {
      const e = err as Error;
      console.error('Error accessing microphone:', e);
      error = 'Could not access the microphone. Please ensure you have given permission.';
    }
  }

  function stopConversation() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      console.log('MediaRecorder stopped');
    }
    isListening = false;
  }
</script>

<main>
  <h1>Language Tutor</h1>
  <p>Press the button and start speaking in German.</p>

  <div class="container">
    {#if isListening}
      <button on:click={stopConversation}>Stop</button>
    {:else}
      <button on:click={startConversation} disabled={isLoading}>Start Talking</button>
    {/if}

    <button on:click={clearHistory} disabled={isLoading}>Clear History</button>

    <div class="topic-selector">
      <label for="topic">Select a Topic:</label>
      <select id="topic" bind:value={selectedTopic}>
        <option>General Conversation</option>
        <option>Ordering at a Restaurant</option>
        <option>Asking for Directions</option>
        <option>At the Airport</option>
      </select>
    </div>

    {#if isLoading}
      <div class="loading">
        <div class="spinner"></div>
        <p>{statusMessage}</p>
      </div>
    {/if}

    {#if error}
      <p class="error">{error}</p>
    {/if}

    {#if hasConversationStarted}
      <div class="transcripts">
        <div class="box">
          <h2>You said (German):</h2>
        <p>{germanText || '...'}</p>
      </div>
      <div class="box">
        <h2>AI Response (English):</h2>
        <p>{englishResponse || '...'}</p>
      </div>
      <div class="box">
        <h2>Translation (German):</h2>
        <p>{germanTranslation || '...'}</p>
      </div>
      <div class="box">
        <h2>Language Tip:</h2>
        <p>{languageTip || '...'}</p>
      </div>
    </div>
  {/if}
  </div>
</main>

<style>
  main {
    font-family: sans-serif;
    text-align: center;
    padding: 2em;
    max-width: 800px;
    margin: 0 auto;
  }

  h1 {
    color: #333;
  }

  .container {
    margin-top: 2em;
  }

  button {
    padding: 1em 2em;
    font-size: 1.2em;
    cursor: pointer;
    border-radius: 8px;
    border: none;
    background-color: #007bff;
    color: white;
    transition: background-color 0.3s;
  }

  button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  button:hover:not(:disabled) {
    background-color: #0056b3;
  }

  .transcripts {
    margin-top: 2em;
    display: grid;
    grid-template-columns: 1fr;
    gap: 1em;
    text-align: left;
  }

  .box {
    border: 1px solid #eee;
    padding: 1em;
    border-radius: 8px;
    background-color: #f9f9f9;
  }

  h2 {
    font-size: 1em;
    color: #555;
    margin-top: 0;
  }

  .loading {
    margin-top: 2em;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border-left-color: #007bff;
    animation: spin 1s ease infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .error {
    color: red;
    margin-top: 1em;
  }
</style>
