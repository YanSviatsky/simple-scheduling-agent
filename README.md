# A Humble Agent, in Parts

In this project you will build a simple scheduling agent. But we will build it in parts

## Part 1: The Memory Loop
For starters, let's see we can talk back and forth with an LLM.
We'll be using the command line for our interface - you already have a function ready for you, exposed from `cli-io.js`:

```js
import { getUserInput } from './cli-io.js';

const userInput = await getUserInput('Say something: ');
console.log("You said:", userInput);
```

Your task is to write a simple infinite loop in `agent.js` that gets the user input, sends it to the LLM, prints the LLM's response, and repeats.

Feel free to use the `askGeminiWithMessages` function from `llmService.js` to send the user input to the LLM.

Example interaction:
```
You: Is the sky blue?
Gemini: I can't see if the sky is blue, so I don't know.
You: Usually? 
Gemini: Yes, usually the sky is blue during the day if there aren't clouds blocking the sun.
```

Notice the LLM retained the context, so when you say "usually?" it knows what you're referring to.

## Part 2: The Tools
For simplicity, we will **not** be using `zod` or a proper schema for our tools.
Instead we will create simple functions and tell the LLM about them in our system prompt.

Here are your tools:
```js
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
```

Now modify your code so that when you send "check availability for tomorrow at 10AM" to the LLM, it tells you to run the `checkAvailability` function, and then *you run it*

Example interaction:
```
You: Hi
Gemini: Hello
You: check availability for tomorrow at 10AM
Checking availability for date: 1991-04-03 10:00:00 // this is a tool call!
```

### Notes
- Your simple agent should either answer normally, or trigger a tool call
- Notice that in the example interaction above, the last log is from the function call itself, **not** the LLM
- For now, simply worry about the answerUser vs. runTool flow - **no need to handle to whole flow**

## Part 3: Finalizing the Agent
Finally, modify your agent loop so that it automatically runs as many times as it needs to complete the user's request.

### Considerations:
- When do you let the user input text?
- How do you exit the loop?
- What and when do you store in the agent's memory?

Example interaction:
```
You: schedule an appointment for tomorrow at 6am
Checking availability for date: April 3rd, 1991
Scheduling appointment for date: April 3rd, 1991
Gemini: Your appointment for April 3rd, 1991 has been scheduled.

You: actually, move it to 9:45 in the evening
Deleting appointment for date: April 3rd, 1991
Checking availability for date: April 3rd, 1991
Scheduling appointment for date: April 3rd, 1991
Gemini: Your appointment has been moved to April 3rd, 1991 at 9:45 PM. I'm finished.
```