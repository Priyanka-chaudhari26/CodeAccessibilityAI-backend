const express = require('express');
require('dotenv').config();
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3001;

function cleanCodeResponse(text) {
  if (!text) return "";
  return text.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "").trim();
}

app.post('/api/explain', async (req, res) => {
  const { code } = req.body;

  const messages = [
    {
      role: "user",
      content: `You are an expert programmer explaining code. Explain the following code snippet in a clear, concise, and accessible way. Please format your explanation using markdown.\n\n${code}`,
    },
  ];

  try {
    const response = await axios.post('https://router.requesty.ai/v1/chat/completions', {
      model: "vertex/google/gemini-2.5-pro",
      messages,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.REQUESTY_API_KEY}`,
        "Content-Type": "application/json",
      }
    });
    console.log("res:",response.data)
    console.log("LLM output:", response.data.choices[0].message.content);
    const explanation = response.data.choices[0].message.content;

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
    const response = await axios.post('https://router.requesty.ai/v1/chat/completions', {
      model: "vertex/google/gemini-2.5-pro",
      messages,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.REQUESTY_API_KEY}`,
        "Content-Type": "application/json",
      }
    });
    const refactoredCode = cleanCodeResponse(response.data.choices[0].message.content);

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
      content: `You are an expert programmer. A user has given the following voice command: '${command}'. Generate the code for this command. Only return the generated code.`,
    },
  ];

  try {
    const response = await axios.post('https://router.requesty.ai/v1/chat/completions', {
      model: "vertex/google/gemini-2.5-pro",
      messages,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.REQUESTY_API_KEY}`,
        "Content-Type": "application/json",
      }
    });
    const generatedCode = cleanCodeResponse(response.data.choices[0].message.content);

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
      content: `You are an expert UI/UX designer. A user has asked for a theme for the following topic: '${topic}'. Please provide a color palette and font suggestions that are accessible for color-blind and visually impaired users. ONLY return a valid JSON object, no extra explanation, no markdown, no text outside JSON. The structure must be exactly: { "palette": { "primary": "#...", "secondary": "#...", "accent": "#...", "background": "#...", "text": "#..." }, "fonts": { "heading": "...", "body": "..." }}. make sure the colors should be suggested for color-bliand and visually impared users.`,
    },
  ];

  try {
    const response = await axios.post('https://router.requesty.ai/v1/chat/completions', {
      model: "vertex/google/gemini-2.5-pro",
      messages,
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.REQUESTY_API_KEY}`,
        "Content-Type": "application/json",
      }
    });
    console.log("res:",response.data.choices[0].message.content)
    const raw = response.data.choices[0].message.content;
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