
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { Profile, Workout } from '../types';
import { WORKOUT_GOALS, PHYSIQUE_GOALS } from "../constants";

const getAiClient = () => {
    // Note: Using a hardcoded API key is not recommended for production applications.
    // It's better to use environment variables for security.
    const API_KEY = 'AIzaSyCSVw08mLd845rh6nZYU6trKiYm7nxi8XY';
    return new GoogleGenAI({ apiKey: API_KEY });
}

const callGeminiWithRetries = async (
    prompt: string, 
    config: any, 
    retries = 3
): Promise<GenerateContentResponse> => {
    const ai = getAiClient();
    let lastError: any;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config,
            });

            if (!response.text) {
                console.warn(`Gemini API returned an empty response on attempt ${attempt}.`, { response });
                throw new Error("The AI service returned an empty response, which could be due to content safety filters.");
            }
            return response;
        } catch (error: any) {
            lastError = error;
            console.error(`Gemini API call attempt ${attempt} failed.`, {
                message: error.message,
                details: JSON.stringify(error, null, 2)
            });
            if (attempt < retries) {
                const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s
                console.log(`Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    console.error("All Gemini API call attempts failed.");
    // Add more context to the final thrown error
    throw new Error(`The AI service failed after ${retries} attempts. Last error: ${lastError.message}`);
};

const workoutSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        week: { type: Type.INTEGER, description: "The week number of the plan (1-12)" },
        day: { type: Type.INTEGER, description: "Day of the workout week (1-5)" },
        focus: { type: Type.STRING, description: "Main focus of the workout, e.g., 'Upper Body Push'" },
        weightExercises: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              sets: { type: Type.INTEGER },
              reps: { type: Type.STRING, description: "Repetition range, e.g., '8-12'" },
              description: { type: Type.STRING, description: "A brief description or instruction for the exercise." },
              completed: { type: Type.BOOLEAN, description: "Always false initially" }
            },
            required: ["name", "sets", "reps", "description", "completed"],
          },
        },
        cardio: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, description: "e.g., Treadmill" },
            duration: { type: Type.INTEGER, description: "Duration in minutes" },
          },
          required: ["type", "duration"],
        },
      },
      required: ["week", "day", "focus", "weightExercises", "cardio"],
    },
};

const getBasePrompt = (user: Profile): string => {
    return `
    User Profile:
    - Name: ${user.name}
    - Height: ${user.height.feet}' ${user.height.inches}"
    - Current Weight: ${user.weight} lbs
    - Goal Weight: ${user.goalWeight} lbs
    - Primary Goal: ${WORKOUT_GOALS[user.goal]}
    - Desired Physique: ${PHYSIQUE_GOALS[user.physique]} - The user wants to gain muscle and get lean (body recomposition), with an emphasis on achieving this physique.

    Workout Constraints:
    - Create a full 12-week plan.
    - 5 workout days per week.
    - 20-45 minutes of weight training per session.
    - 30 minutes of treadmill cardio after each weight session.

    Please generate a balanced 12-week workout plan tailored to this user's profile and constraints.
    - The plan must be specifically designed to help the user go from their current weight to their goal weight with their desired physique in mind.
    - The plan must incorporate the principle of progressive overload. This means the workouts should gradually become more challenging over the 12 weeks, for example by increasing reps, sets, or exercise difficulty.
    - Each day should have a clear focus (e.g., Upper Body Push, Lower Body, etc.).
    - The exercises should be common and effective for their goal.
    - For each exercise, provide a brief description or instruction on how to perform it.
    - Ensure the 'completed' field for each exercise is initially set to false.
    - The final output should be a single JSON array containing 60 workout objects (12 weeks * 5 days).
    `;
};


export const generateInitialPlan = async (user: Profile): Promise<Workout[]> => {
    try {
        const prompt = getBasePrompt(user);
        const config = {
            responseMimeType: "application/json",
            responseSchema: workoutSchema,
        };
        const response = await callGeminiWithRetries(prompt, config);
        
        const jsonText = response.text.trim();
        const plan = JSON.parse(jsonText) as Workout[];
        return plan.sort((a, b) => a.week - b.week || a.day - b.day);
    } catch (error: any) {
        console.error("Failed to generate initial plan after all retries:", error);
        throw error; // Rethrow the detailed error from callGeminiWithRetries
    }
};

export const modifyWorkoutPlan = async (currentPlan: Workout[], userRequest: string): Promise<Workout[]> => {
    try {
        const prompt = `
        You are an AI assistant that modifies a user's 12-week workout plan based on their request.
        The user's current plan is provided as a JSON object. The user's modification request is provided as a string.
        Your task is to return the complete, updated 12-week workout plan as a single JSON array.

        **CRITICAL INSTRUCTIONS:**
        1.  Your ENTIRE response MUST be the raw JSON array.
        2.  Do NOT wrap the JSON in markdown code blocks (e.g., \`\`\`json).
        3.  Do NOT add any introductory text, explanations, or concluding remarks.
        4.  The returned JSON MUST conform to the original schema.
        5.  Preserve the 'completed' status of exercises unless the request implies otherwise.
        6.  Ensure the plan still adheres to the principles of progressive overload and the user's original goals.

        Here is the user's current 12-week workout plan:
        ${JSON.stringify(currentPlan, null, 2)}

        Here is the user's request: "${userRequest}"

        Now, provide the complete, modified 12-week plan as a single JSON array.
        `;
        const config = {
            responseMimeType: "application/json",
            responseSchema: workoutSchema,
        };
        const response = await callGeminiWithRetries(prompt, config);
        
        const jsonText = response.text.trim();
        const plan = JSON.parse(jsonText) as Workout[];
        return plan.sort((a, b) => a.week - b.week || a.day - b.day);

    } catch (error: any) {
        console.error("Failed to modify workout plan after all retries:", error);
        throw error; // Rethrow the detailed error from callGeminiWithRetries
    }
};