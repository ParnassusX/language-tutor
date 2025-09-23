// DOM Elements
const recordButton = document.getElementById('recordButton');
const statusElement = document.getElementById('status');
const conversationElement = document.getElementById('conversation');
const targetLanguageSelect = document.getElementById('target-language');

// Check for browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
const SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent;

let recognition;
let isRecording = false;
let mediaRecorder;
let audioChunks = [];

// Initialize the application
function init() {
    if (!SpeechRecognition) {
        showError('Speech recognition is not supported in this browser.');
        return;
    }

    setupSpeechRecognition();
    setupEventListeners();
    updateStatus('Click and hold the button to speak');
}

// Set up the speech recognition
function setupSpeechRecognition() {
    recognition = new SpeechRecognition();
    
    // Configure recognition
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US'; // Default language

    // Event handlers
    recognition.onresult = handleRecognitionResult;
    recognition.onerror = handleRecognitionError;
    recognition.onspeechend = handleSpeechEnd;
}

// Set up event listeners
function setupEventListeners() {
    // Mouse events for recording
    recordButton.addEventListener('mousedown', startRecording);
    recordButton.addEventListener('mouseup', stopRecording);
    recordButton.addEventListener('mouseleave', stopRecording);
    
    // Touch events for mobile
    recordButton.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startRecording();
    });
    
    recordButton.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopRecording();
    });
    
    // Language change
    targetLanguageSelect.addEventListener('change', updateLanguage);
}

// Start recording audio
function startRecording() {
    if (isRecording) return;
    
    isRecording = true;
    recordButton.classList.add('recording');
    updateStatus('Listening... Speak now!');
    
    // Clear previous audio chunks
    audioChunks = [];
    
    // Start speech recognition
    recognition.start();
    
    // Start audio recording if supported
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                    }
                };
                
                mediaRecorder.onstop = processAudio;
            })
            .catch(err => {
                console.error('Error accessing microphone:', err);
                showError('Could not access microphone. Please check permissions.');
                stopRecording();
            });
    }
}

// Stop recording
function stopRecording() {
    if (!isRecording) return;
    
    isRecording = false;
    recordButton.classList.remove('recording');
    updateStatus('Processing...');
    
    // Stop speech recognition
    recognition.stop();
    
    // Stop audio recording if it was started
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
}

// Process the recorded audio
function processAudio() {
    // In a real app, you would send the audio to your backend here
    // For now, we'll just use the recognized text from the SpeechRecognition API
    console.log('Audio recorded, chunks:', audioChunks.length);
}

// Handle speech recognition result
function handleRecognitionResult(event) {
    const transcript = event.results[0][0].transcript;
    const confidence = event.results[0][0].confidence;
    
    if (transcript.trim() === '') {
        updateStatus('No speech detected. Try again.');
        return;
    }
    
    // Display user's message
    addMessage('user', transcript);
    
    // Process the message and get tutor's response
    processUserMessage(transcript);
}

// Process the user's message and generate a response
async function processUserMessage(message) {
    try {
        // Show typing indicator
        const typingId = showTypingIndicator();
        
        // In a real app, you would send this to your backend API
        // For now, we'll simulate a response
        const targetLanguage = targetLanguageSelect.value;
        const response = await simulateTutorResponse(message, targetLanguage);
        
        // Remove typing indicator
        removeTypingIndicator(typingId);
        
        // Display tutor's response
        addMessage('tutor', response);
        
        // Speak the response
        speak(response, targetLanguage);
        
        updateStatus('Ready');
    } catch (error) {
        console.error('Error processing message:', error);
        showError('Sorry, there was an error processing your message.');
    }
}

// Simulate a tutor response (replace with actual API call)
async function simulateTutorResponse(message, targetLanguage) {
    // In a real app, this would be an API call to your backend
    // which would use an LLM to generate a response in the target language
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple response simulation based on language
    const responses = {
        'es': `¡Hola! Has dicho: "${message}". En español, podrías decir algo similar. ¿En qué más puedo ayudarte hoy?`,
        'fr': `Bonjour ! Vous avez dit : "${message}". En français, vous pourriez dire quelque chose de similaire. Comment puis-je vous aider aujourd'hui ?`,
        'de': `Hallo! Du hast gesagt: "${message}". Auf Deutsch könntest du etwas Ähnliches sagen. Wobei kann ich dir heute helfen?`,
        'it': `Ciao! Hai detto: "${message}". In italiano potresti dire qualcosa di simile. In cosa posso aiutarti oggi?`,
        'ja': `こんにちは！あなたは「${message}」と言いました。日本語で似たようなことを言うことができます。今日は何かお手伝いできることはありますか？`
    };
    
    return responses[targetLanguage] || `I heard you say: "${message}". How can I help you with your ${targetLanguage} practice today?`;
}

// Convert text to speech
function speak(text, lang) {
    if (!('speechSynthesis' in window)) {
        console.warn('Text-to-speech not supported in this browser');
        return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang || 'en-US';
    utterance.rate = 0.9;
    
    // Set voice based on language if available
    const voices = window.speechSynthesis.getVoices();
    const targetVoices = voices.filter(voice => voice.lang.startsWith(lang));
    if (targetVoices.length > 0) {
        utterance.voice = targetVoices[0];
    }
    
    window.speechSynthesis.speak(utterance);
}

// Show typing indicator
function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const typingElement = document.createElement('div');
    typingElement.id = id;
    typingElement.className = 'message tutor-message';
    
    const typingContent = document.createElement('div');
    typingContent.className = 'typing-indicator';
    typingContent.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;
    
    typingElement.appendChild(typingContent);
    conversationElement.appendChild(typingElement);
    conversationElement.scrollTop = conversationElement.scrollHeight;
    
    return id;
}

// Remove typing indicator
function removeTypingIndicator(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

// Add a message to the conversation
function addMessage(sender, text) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}-message`;
    
    const senderElement = document.createElement('div');
    senderElement.className = 'message-sender';
    senderElement.textContent = sender === 'user' ? 'You' : 'Tutor';
    
    const textElement = document.createElement('div');
    textElement.className = 'message-text';
    textElement.textContent = text;
    
    messageElement.appendChild(senderElement);
    messageElement.appendChild(textElement);
    
    conversationElement.appendChild(messageElement);
    conversationElement.scrollTop = conversationElement.scrollHeight;
}

// Handle recognition errors
function handleRecognitionError(event) {
    console.error('Speech recognition error', event.error);
    let errorMessage = 'An error occurred with speech recognition.';
    
    switch(event.error) {
        case 'no-speech':
            errorMessage = 'No speech was detected. Please try again.';
            break;
        case 'audio-capture':
            errorMessage = 'No microphone was found. Please ensure a microphone is connected.';
            break;
        case 'not-allowed':
            errorMessage = 'Permission to use microphone was denied. Please allow microphone access and try again.';
            break;
    }
    
    showError(errorMessage);
    stopRecording();
}

// Handle speech end
function handleSpeechEnd() {
    if (isRecording) {
        stopRecording();
    }
}

// Update the status message
function updateStatus(message) {
    statusElement.textContent = message;
}

// Show an error message
function showError(message) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    // Insert at the top of the conversation
    if (conversationElement.firstChild) {
        conversationElement.insertBefore(errorElement, conversationElement.firstChild);
    } else {
        conversationElement.appendChild(errorElement);
    }
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        errorElement.remove();
    }, 5000);
}

// Update language for speech recognition
function updateLanguage() {
    const languageCode = targetLanguageSelect.value;
    recognition.lang = languageCode;
    
    // In a real app, you might want to update the UI language here
    console.log('Language updated to:', languageCode);
}

// Load voices when they become available
window.speechSynthesis.onvoiceschanged = function() {
    // This will update the voices for the speak function
};

// Initialize the app when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
