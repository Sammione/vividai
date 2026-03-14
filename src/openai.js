import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // For this specific client-only demo
});

export const generateVideoConcept = async (prompt) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: `You are an expert AI Video Producer. Given a prompt, generate:
        1. A 3-scene storyboard description.
        2. A script for each scene.
        3. Timed subtitles for a 15-second video.
        Format your response as a JSON object with keys: scenes (array of objects with description and script), and subtitles (array of objects with time and text).`
      },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  return JSON.parse(completion.choices[0].message.content);
};

export const generateImagePrompt = async (sceneDescription) => {
    // We can use this to eventually generate assets with DALL-E
    const completion = await openai.images.generate({
        model: "dall-e-3",
        prompt: `Cinematic animation style, modern aesthetic, high quality: ${sceneDescription}`,
        n: 1,
        size: "1024x1024",
    });
    return completion.data[0].url;
}
