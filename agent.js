import { askGeminiWithMessages } from './llmService.js';
import { getUserInput } from './cli-io.js';

const memory = [{
    role: 'model',
    parts: [{ text: 'Always respond in valid JSON, with this format: {"answer": string}' }],
}]

const addToMemory = (role, text) => {
    memory.push({ role, parts: [{ text }] })
}

async function main() {
    while (true) {
        const userInput = await getUserInput('You: ');
        addToMemory('user', userInput);

        const llmResponse = await askGeminiWithMessages(memory);
        addToMemory('model', llmResponse.answer);

        console.log('Gemini:', llmResponse.answer);
    }
}

main();
