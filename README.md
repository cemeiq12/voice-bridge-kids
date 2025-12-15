# Voice Bridge Kids 🎈

**Voice Bridge Kids** is a specialized, therapeutic AI companion designed to help children develop speech fluency, emotional intelligence, and creative expression in a safe, guaranteed fun "Voice Playground".

Built with Next.js, Google Vertex AI (Gemini), and Web Speech API.

## ✨ Features

### 🎤 Voice Playground
A simplified, colorful interface for speech practice.
- **Word Fun**: Practice vowels and simple words with instant star-rating feedback (⭐⭐⭐).
- **Animal Personas**: Interact with **Buddy the Lion** 🦁, **Wise Owl** 🦉, or **Robo-Coach** 🤖.

### 🪞 Emotional Magic Mirror
Helps children recognize and name their feelings.
- **How it works**: The child speaks a feeling ("I'm sad"), and the AI "mirrors" it back with a validation and a specific "Magic Thought" to reframe the emotion positively.

### 🌍 Magical World Builder
Collaborative storytelling and imagination.
- **Create**: Child describes a "Happy Place" (e.g., "A candy castle").
- **Visualize**: The app generates a customized story and a **visual illustration** of their world (using Gemini).

### 🧸 Therapeutic Play Time
Unstructured play scenarios with subtle social-emotional learning goals.
- **Scenarios**:
    - **Magic Clay** 🎨 (Creativity)
    - **Grumpy Dragon** 🐲 (Empathy & Conflict Resolution)
    - **Picnic Party** 🧺 (Social Manners)

### 🎨 Color My Feeling Reporter
A simple tool for reporting complex emotions.
- **Mood Palette**: 5 Colors (Red, Yellow, Blue, Green, Black) representing core feeling groups.
- **Contextual Analysis**: Child taps a color -> speaks -> AI provides color-coded validation and coping strategies.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Google Gemini API Key (get from https://aistudio.google.com/apikey)
- ElevenLabs API Key (for text-to-speech)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/cemeiq12/voice-bridge-kids.git
    cd voice-bridge-kids
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up environment variables**
    Create a `.env.local` file:
    ```env
    GOOGLE_VERTEX_AI_API_KEY=your_google_api_key_here
    ELEVENLABS_API_KEY=your_elevenlabs_key
    NEXT_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_key
    DATABASE_URL="file:./dev.db"
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  **Open the App**
    Visit [http://localhost:3000/kids](http://localhost:3000/kids) to enter the Playground.

## 🛡️ Privacy & Safety
This application is designed with safety in mind. All AI interactions are prompted to be gentle, supportive, and age-appropriate. No data is shared with third parties beyond the necessary AI providers (Google Gemini, ElevenLabs) for processing.
