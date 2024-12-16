

# Mimir AI: Intelligent Enterprise Assistant (Team Maverick_24)

**Smart India Hackathon 2024 - Problem Statement ID: 1706**

## Project Overview

The Intelligent Enterprise Assistant is an AI-driven chatbot solution designed to enhance organizational efficiency. With advanced NLP capabilities, document processing, and a lifelike digital avatar, it supports real-time, context-aware interactions that boost productivity and decision-making.

### Features:
- **Digital Human Avatar**: Engages users with human-like responses.
- **Multimodal Input Support**: Processes text, voice, image, and document inputs.
- **Real-time Performance**: Resolves queries in under 5 seconds with support for 10+ concurrent users.
- **Document Processing**: Extracts, summarizes, and compares key information from uploaded files.
- **Security**: Features email-based two-factor authentication (2FA) and inappropriate language filtering.

---

## Technical Architecture

1. **Input Handling**:
   - Text and Speech-to-Text processing.
   - Document uploads via Firebase with presigned URLs.

2. **Processing Pipeline**:
   - Uses a Large Language Model (LLM) with Retrieval-Augmented Generation (RAG).
   - Document chunks are embedded for efficient retrieval.

3. **Output Generation**:
   - Responses delivered in text and voice (Text-to-Speech).
   - Digital human avatar provides lifelike interactions with multilingual lip-sync support.

4. **Cloud Infrastructure**:
   - Scalable backend leveraging Firebase for operational efficiency.

---

## Challenges and Mitigations

### Potential Challenges:
- Real-time response generation and lip-syncing latency.
- Multilingual lip-sync complexity.
- Smooth performance in concurrent user scenarios.

### Strategies:
- Optimization of Rhubarb Lipsync for real-time performance.
- Machine learning-based context maintenance.
- Continuous testing and enhancement of system modules.

---

## Current Status

- **Product Completion**: 60% (Development in progress).
- **Next Steps**:
  - Testing and validation.
  - Performance optimizations.

---

## Benefits and Impact

- **Multilingual Support**: Inclusive for diverse user demographics.
- **Accessibility**: Aids users with disabilities through voice and image recognition.
- **Cost Reduction**: Automates routine tasks, minimizing operational expenses.
- **Environment-Friendly**: Cloud infrastructure reduces the carbon footprint.

---

## Getting Started

### Prerequisites:
- Node.js and npm
- Unreal Engine (for digital human integration)
- Firebase setup

### Installation:
1. Clone the repository:
   ```bash
   git clone https://github.com/KishoreMuruganantham/intelligent-enterprise-assistant.git
   ```
2. Navigate to the project directory:
   ```bash
   cd intelligent-enterprise-assistant
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

4. Configure Firebase and AWS credentials in the `.env` file.

### Running the Project:
- Start the backend server:
  ```bash
  npm start
  ```
- Launch the digital human integration in Unreal Engine.

---

## Authors  

**Team Maverick_24**  
Participants of Smart India Hackathon 2024  

1. [Mugundhan Y](https://github.com/MugundhanY)  
2. [Mukundh A P](https://github.com/MukundhArul)  
3. [Praveen Kumar R](https://github.com/praveen647)  

---

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
```
