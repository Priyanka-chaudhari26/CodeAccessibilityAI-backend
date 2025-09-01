const express = require('express');
require('dotenv').config();
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3001;
const URL=process.env.OPENROUTER_URL || "https://openrouter.ai/api/v1/chat/completions";
const MODEL=process.env.OPENROUTER_MODEL;
const API_KEY=process.env.OPENROUTER_API_KEY;

function cleanCodeResponse(text) {
  if (!text) return "";
  return text.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "").trim();
}

app.post('/api/explain', async (req, res) => {
  const { code } = req.body;

  const messages = [
    {
      role: "user",
      content: `You are an expert programmer. Explain the following code snippet in **plain, simple English**, like you are teaching a beginner. Just give a breif, clear explanation:\n\n${code}`,
    },
  ];

  try {
    const response = await axios.post(URL, {
      model: MODEL,
      messages,
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      }
    });
    console.log("res:",response.data)
    console.log("LLM output:", response.data.choices[0].message.content);
    const explanation = response.data?.choices?.[0]?.message?.content || "";

    res.json({ explanation });
  } catch (error) {
    console.error('Error calling Requesty API:', error);
    res.status(500).json({ error: 'Failed to get explanation from AI' });
  }
});

app.post('/api/refactor', async (req, res) => {
  const { code, command } = req.body;

  const messages = [
    {
      role: "user",
      content: `You are an expert programmer. A user has given the following voice command: '${command}'. Apply this command to the following code: ${code}. Only return the refactored code.`,
    },
  ];

  try {
    const response = await axios.post(URL, {
      model: MODEL,
      messages,
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      }
    });
    const output = response.data?.choices?.[0]?.message?.content || "";
    const refactoredCode = cleanCodeResponse(output);

    res.json({ refactoredCode });
  } catch (error) {
    console.error('Error calling Requesty API:', error);
    res.status(500).json({ error: 'Failed to refactor code' });
  }
});

app.post('/api/generate', async (req, res) => {
  const { command } = req.body;

  const messages = [
    {
      role: "user",
      content: `You are an expert programmer. A user has given the following command: '${command}'. Generate the code for this command. Only return the generated code.`,
    },
  ];

  try {
    const response = await axios.post(URL, {
      model: MODEL,
      messages,
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      }
    });
    const output = response.data?.choices?.[0]?.message?.content || "";
    const generatedCode = cleanCodeResponse(output);

    res.json({ generatedCode });
  } catch (error) {
    console.error('Error calling Requesty API:', error);
    res.status(500).json({ error: 'Failed to generate code' });
  }
});

app.post('/api/suggest-theme', async (req, res) => {
  const { topic } = req.body;

  const messages = [
    {
      role: "user",
      content: `You are an expert UI/UX designer. A user has asked for a theme for the following topic: '${topic}'. Generate a unique and creative color palette that reflects this topic, but ensure it remains fully accessible for color-blind and visually impaired users. All colors must pass WCAG 2.1 AA contrast ratios for both normal and large text. Do not always default to white background, blue primary, or gray secondary. Instead, choose topic-appropriate colors that are still accessible. Examples of topic-based palettes:Nature : greens and earthy tones, Technology : blues and purples,Food : warm reds and oranges, Fashion : pastels and neutrals. ONLY return a valid JSON object, no extra explanation, no markdown, no text outside JSON. The structure must be exactly: { "palette": { "primary": "#...", "secondary": "#...", "accent": "#...", "background": "#...", "text": "#..." }, "fonts": { "heading": "...", "body": "..." }}.`

    },
  ];

  try {
    const response = await axios.post(URL, {
      model: MODEL,
      messages,
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      }
    });
    const raw = response.data?.choices?.[0]?.message?.content || "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("No JSON found in response");
    }
    const theme = JSON.parse(match[0]);
    res.json({ theme });
  } catch (error) {
    console.error('Error calling Requesty API:', error);
    res.status(500).json({ error: 'Failed to suggest theme' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});