import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
import readlineSync from "readline-sync";

let History = [];
const APIKey = process.env.GEMINI_API;
const ai = new GoogleGenAI({ apiKey: APIKey });

// ---------------------- Utility Functions -----------------------

function sum({ num1, num2 }) {
    return num1 + num2;
}

function subtract({ num1, num2 }) {
    return num1 - num2;
}

function multiply({ num1, num2 }) {
    return num1 * num2;
}

function divide({ num1, num2 }) {
    if (num2 === 0) return "❌ Cannot divide by zero!";
    return num1 / num2;
}

function prime({ num }) {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) return false;
    }
    return true;
}

async function getCryptoPrice({ coin }) {
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coin}`);
    if (!response.ok) {
        return `❌ Failed to fetch price for ${coin}`;
    }
    const data = await response.json();
    if (data.length === 0) return `❌ Coin "${coin}" not found`;
    return `💰 Current price of ${coin}: $${data[0].current_price}`;
}

async function getCricketData({ country }) {
    const response = await fetch(`https://api.cricapi.com/v1/currentMatches?apikey=${process.env.CRICKET_API}&offset=0`);
    const result = await response.json();
    return result;
}

// ---------------------- Function Declarations -----------------------

const sumDeclaration = {
    name: "sum",
    description: "Sum two numbers",
    parameters: {
        type: "OBJECT",
        properties: {
            num1: { type: "NUMBER", description: "First number" },
            num2: { type: "NUMBER", description: "Second number" }
        },
        required: ["num1", "num2"]
    }
};

const subtractDeclaration = {
    name: "subtract",
    description: "Subtract two numbers",
    parameters: {
        type: "OBJECT",
        properties: {
            num1: { type: "NUMBER", description: "First number" },
            num2: { type: "NUMBER", description: "Second number" }
        },
        required: ["num1", "num2"]
    }
};

const multiplyDeclaration = {
    name: "multiply",
    description: "Multiply two numbers",
    parameters: {
        type: "OBJECT",
        properties: {
            num1: { type: "NUMBER", description: "First number" },
            num2: { type: "NUMBER", description: "Second number" }
        },
        required: ["num1", "num2"]
    }
};

const divideDeclaration = {
    name: "divide",
    description: "Divide two numbers",
    parameters: {
        type: "OBJECT",
        properties: {
            num1: { type: "NUMBER", description: "Numerator" },
            num2: { type: "NUMBER", description: "Denominator" }
        },
        required: ["num1", "num2"]
    }
};

const primeDeclaration = {
    name: "prime",
    description: "Check if a number is prime",
    parameters: {
        type: "OBJECT",
        properties: {
            num: { type: "NUMBER", description: "Number to check" }
        },
        required: ["num"]
    }
};

const getCryptoPriceDeclaration = {
    name: "getCryptoPrice",
    description: "Get the current price of a cryptocurrency",
    parameters: {
        type: "OBJECT",
        properties: {
            coin: { type: "STRING", description: "Cryptocurrency name (e.g., bitcoin)" }
        },
        required: ["coin"]
    }
};

const getCricketDeclaration = {
    name: "getCricketData",
    description: "Get the data of cricket",
    parameters: {
        type: "OBJECT",
        properties: {
            country: { type: "STRING", description: "Country Name (e.g., India)" }
        },
        required: ["country"]
    }
};

// ---------------------- Tool Map -----------------------

const availableTool = {
    sum,
    subtract,
    divide,
    multiply,
    prime,
    getCryptoPrice,
    getCricketData
};

// ---------------------- Agent Runner -----------------------

async function runAgent(userProblem) {
    History.push({
        role: "user",
        parts: [{ text: userProblem }]
    });

    let response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: History,
        config: {
            tools: [{
                functionDeclarations: [
                    sumDeclaration,
                    subtractDeclaration,
                    multiplyDeclaration,
                    divideDeclaration,
                    primeDeclaration,
                    getCryptoPriceDeclaration,
                    getCricketDeclaration
                ]
            }]
        }
    });

    while (true) {
        if (response.functionCalls && response.functionCalls.length > 0) {
            const { name, args } = response.functionCalls[0];
            const func = availableTool[name];
            const result = await func(args);

            const functionResponsePart = {
                name: name,
                response: {
                    result: result,
                }
            };

            History.push({ role: "model", parts: [{ functionCall: response.functionCalls[0] }] });
            History.push({ role: "function", parts: [{ functionResponse: functionResponsePart }] });

            response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: History,
                config: {
                    tools: [{
                        functionDeclarations: [
                            sumDeclaration,
                            subtractDeclaration,
                            multiplyDeclaration,
                            divideDeclaration,
                            primeDeclaration,
                            getCryptoPriceDeclaration,
                            getCricketDeclaration
                        ]
                    }]
                }
            });

        } else {
            History.push({ role: "model", parts: [{ text: response.text }] });
            console.log("🤖 Gemini says:", response.text);
            break;
        }
    }
}

// ---------------------- Main CLI Loop -----------------------

async function main() {
    while (true) {
        const userProblem = readlineSync.question("🧠 Ask me anything (or type 'exit' to quit): ");
        if (userProblem.toLowerCase() === 'exit') {
            console.log("👋 Goodbye!");
            break;
        }
        await runAgent(userProblem);
    }
}

main();
