import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateInterviewQuestions(req, res) {
  try {
    const { resumeText, role } = req.body;
    const prompt = `Generate 10 interview questions for ${role || "software engineer"} based on resume:
${resumeText}`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ questions: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI error" });
  }
}

export async function generateRoadmap(req, res) {
  try {
    const { interests } = req.body;
    const prompt = `Create a 6-month roadmap to succeed in ${interests} field (software-related).`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ roadmap: completion.choices[0].message.content });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI error" });
  }
}
