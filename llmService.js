import { GoogleGenAI } from '@google/genai';
import JSON5 from 'json5';
import dotenv from 'dotenv';

dotenv.config();

const gemini = new GoogleGenAI({});

// Example usage:
/*
    const llmResponse = await askGeminiWithMessages([
        {
            role: 'user',
            content: 'What is your name? Respond in valid JSON: {"name": "John Doe"}',
        },
    ]);

    console.log(`My name is ${llmResponse.name}`);
*/

export const askGeminiWithMessages = async (messages) => {
    try {
        const result = await gemini.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: messages,
            config: {
                thinkingConfig: {
                    thinkingBudget: 0,
                },
            },
        });

        const response = result.text;
        if (!response) return {};

        const parsedResponse = parseJSONFromString(response, 'object');
        return parsedResponse
    } catch (error) {
        console.error('Error generating content with LLM:', error);
        throw error;
    }
};


export const parseJSONFromString = (
    result,
    expectedType, //array or object
) => {
    const [startChar, endChar] = expectedType === 'object' ? ['{', '}'] : ['[', ']'];

    const start = result.indexOf(startChar);
    const end = result.lastIndexOf(endChar);

    if (start === -1 || end === -1) {
        const stringifiedResult = JSON.stringify(result);

        console.error(`Bad JSON result
      \nresultStart:${stringifiedResult.slice(0, 500)}
      \nresultEnd: ${stringifiedResult.slice(stringifiedResult.length - 500)}
      `);

        throw new Error(`Unable to locate JSON (${expectedType})`);
    }

    return JSON5.parse(result.slice(start, end + 1));
};
