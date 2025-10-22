import { askGeminiWithMessages } from './llmService.js';
import { getUserInput } from './cli-io.js';

// Tool functions
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

// Tool registry
const tools = {
    checkAvailability,
    scheduleAppointment,
    deleteAppointment
};

async function main() {
    // Initialize conversation history
    const messages = [];

    // Add system prompt to instruct the LLM on response format and available tools
    messages.push({
        role: 'user',
        parts: [{ text: `You are a helpful scheduling assistant. You have access to the following tools:

1. checkAvailability(date) - Check if a date/time is available
2. scheduleAppointment(date) - Schedule an appointment for a date/time
3. deleteAppointment(date) - Delete an appointment for a date/time

Always respond in valid JSON format with ONE of these structures:

For normal conversation (when you're done with tools or just chatting):
{"action": "answerUser", "response": "Your message here"}

For tool calls (when you need to check/schedule/delete):
{"action": "runTool", "tool": "toolName", "arguments": {"date": "formatted date string"}}

Important rules:
- Use tools to complete scheduling tasks
- You can call multiple tools in sequence (e.g., check availability, then schedule)
- After running tools, always return to the user with "answerUser" to confirm what you did
- Format dates clearly (e.g., "April 3rd, 1991 at 6:00 AM")

Examples:
- User says "Hi" -> {"action": "answerUser", "response": "Hello! How can I help you with scheduling?"}
- User says "schedule appointment for tomorrow at 6am" -> First {"action": "runTool", "tool": "checkAvailability", ...}, then {"action": "runTool", "tool": "scheduleAppointment", ...}, then {"action": "answerUser", "response": "Your appointment has been scheduled..."}` }]
    });

    console.log("Starting conversation with Gemini. Type your messages below.\n");

    // Outer loop: Get user input
    while (true) {
        // Get user input
        const userInput = await getUserInput('You: ');

        // Add user message to conversation history
        messages.push({
            role: 'user',
            parts: [{ text: userInput }]
        });

        // Inner loop: Keep running until agent is done (returns answerUser)
        let isDone = false;
        while (!isDone) {
            // Get LLM response
            const llmResponse = await askGeminiWithMessages(messages);

            // Add LLM response to conversation history
            messages.push({
                role: 'model',
                parts: [{ text: JSON.stringify(llmResponse) }]
            });

            // Check if it's a tool call or a normal response
            if (llmResponse.action === 'runTool') {
                // Execute the tool
                const toolName = llmResponse.tool;
                const toolArgs = llmResponse.arguments;

                if (tools[toolName]) {
                    const result = tools[toolName](toolArgs.date);

                    // Add tool result to conversation history so the LLM knows what happened
                    messages.push({
                        role: 'user',
                        parts: [{ text: `Tool ${toolName} returned: ${JSON.stringify(result)}` }]
                    });
                } else {
                    console.log(`Unknown tool: ${toolName}`);
                    messages.push({
                        role: 'user',
                        parts: [{ text: `Error: Unknown tool ${toolName}` }]
                    });
                }
                // Continue the loop - agent needs to decide what to do next
            } else if (llmResponse.action === 'answerUser') {
                // Display normal response
                const responseText = llmResponse.response || "I couldn't generate a response.";
                console.log(`Gemini: ${responseText}\n`);

                // Exit inner loop - agent is done with this request
                isDone = true;
            } else {
                // Unknown action, treat as answer
                console.log(`Gemini: ${JSON.stringify(llmResponse)}\n`);
                isDone = true;
            }
        }
    }
}

main();
