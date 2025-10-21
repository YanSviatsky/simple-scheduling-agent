import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Example usage:
/*
    const userInput = await getUserInput('What is your name? ');
    console.log(`Hello, ${userInput}!`);
*/
export const getUserInput = (question) => {
    return new Promise(resolve => rl.question(question, resolve));
}