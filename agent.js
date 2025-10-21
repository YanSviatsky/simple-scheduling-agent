import { askGeminiWithMessages } from './llmService.js';
import { getUserInput } from './cli-io.js';

const checkAvailability = (date) => {
    console.log("Checking availability for date:", date);
    return { available: true }
}

const scheduleAppointment = (date) => {
    console.log("Scheduling appointment for date:", date);
    return { success: true }
}

const deleteAppointment = (date) => {
    console.log("Deleting appointment for date:", date);
    return { success: true }
}

const memory = [{
    role: 'model',
    parts: [{
        text: `
        You are a scheduling agent.
        You will receive a request from a user.
        Either answer normally, or indicate that one (more more) tools should be called.

        Note that today is April 2nd, 1991.

        You have the following tools available:
        - checkAvailability(date): checks if the given date is available
        - scheduleAppointment(date): schedules an appointment for the given date - only use this if you've checked the date is available first.
        - deleteAppointment(date): deletes an appointment for the given date

        Always answer with a valid JSON object in the following structure:
        {
            "tools": [{toolName: string, input: string}, ...] | [],
            "userResponse": string | null
        }

        Note that if there are no tools to call, you MUST offer a "userResponse"
        ` }],
}]

const addToMemory = (role, text) => {
    memory.push({ role, parts: [{ text }] })
}

const processToolCalls = (tools) => {
    if (!tools) { console.log("No tools or user response found in LLM response"); return }

    for (const tool of tools) {
        const { toolName, input } = tool;

        let toolResponse;
        if (toolName === 'checkAvailability') {
            toolResponse = checkAvailability(input);
        }
        else if (toolName === 'scheduleAppointment') {
            toolResponse = scheduleAppointment(input);
        }
        else if (toolName === 'deleteAppointment') {
            toolResponse = deleteAppointment(input);
        }

        addToMemory('user', JSON.stringify({ toolName, input, toolResponse }));
    }

}

let steps = 0; // Failsafe so we don't run into an infinite loop and burn all our tokens
let needUserInput = true;

async function main() {
    while (steps < 5) {
        if (needUserInput) {
            steps = 0
            const userInput = await getUserInput('You: ');
            needUserInput = false;
            addToMemory('user', userInput);
        }

        const llmResponse = await askGeminiWithMessages(memory);
        addToMemory('model', JSON.stringify(llmResponse));

        const { tools, userResponse } = llmResponse;

        // If we have a response for the user, no need to run tools (per our system prompt), hence the `continue` to restart the loop
        if (userResponse) {
            console.log(userResponse);
            needUserInput = true;
            continue;
        }

        processToolCalls(tools);

        await new Promise(r => setTimeout(r, 500)); // To avoid rate limiting
        steps++;
    }
}

main();
