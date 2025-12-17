import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  AI: any
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/*', cors())

app.get('/', (c) => {
  return c.text('Hello PokePrompt!')
})

app.post('/api/generate', async (c) => {
  try {
    const { image } = await c.req.json<{ image: string }>()
    if (!image) {
      return c.json({ error: 'Image is required' }, 400)
    }

    // Decode base64 image (image string is expected to be raw base64 without data URI scheme, or we strip it)
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    const imageInput = Array.from(imageBytes);

    // 1. Analyze image with Vision Model
    const descriptionResponse = await c.env.AI.run('@cf/meta/llama-3.2-11b-vision-instruct', {
      image: imageInput,
      prompt: "Describe the main subject of this image creatively. What creature, object, or character does it look like? What elemental alignment (Fire, Water, Grass, Electric, Psychic, Fighting, Darkness, Metal, Fairy, Dragon, Colorless) would it have in a tailored card game context?"
    });

    if (!descriptionResponse || !descriptionResponse.response) {
       throw new Error("Failed to analyze image");
    }

    const description = descriptionResponse.response;

    // 2. Generate Stats with Llama 3.3
    const prompt = `
    Based on this description: "${description}", create a custom Pokemon-style card data structure in valid JSON format.
    The JSON must adhere to this schema:
    {
      "name": "Creative Name",
      "hp": "Integer (e.g. 120)",
      "type": "One of [Fire, Water, Grass, Electric, Psychic, Fighting, Darkness, Metal, Fairy, Dragon, Colorless]",
      "description": "Flavor text about the creature",
      "creatureType": "String (e.g. 'Human', 'Alien', 'Robot', 'Monster', etc.)",
      "moves": [
         { "name": "Move Name", "damage": "String (e.g. 30+)", "cost": ["Colorless", "Fire"], "description": "Effect description" }
      ],
      "weakness": { "type": "Type", "value": "x2" },
      "resistance": { "type": "Type", "value": "-30" },
      "retreat": 1
    }
    Return ONLY the JSON object. Do not wrap in markdown code blocks.
    `;

    const statsResponse = await c.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: 'You are a creative game designer. You output strict JSON only.' },
        { role: 'user', content: prompt }
      ]
    });

    return c.json(statsResponse.response);

  } catch (error: any) {
    console.error(error);
    return c.json({ error: error.message || "An error occurred" }, 500);
  }
})

app.post('/api/chat', async (c) => {
  try {
     const { messages, currentCard } = await c.req.json();
     
     const systemPrompt = `
     You are the creature on this Pokemon card. You are talking to your trainer (the user).
     Current Card Data: ${JSON.stringify(currentCard)}
     
     The trainer will issue a command to modify you or your stats.
     1. Update the JSON card data to reflect the changes requested.
     2. Generate a short, valid in-character response (1-2 sentences) acknowledging the change.
     For example, if the trainer asks you to "evolve" you, you might respond with "Pikachu feels an overwhelming power coursing through its body!"
     
     Return a JSON object with this EXACT structure:
     {
       "card": { ...only parts of the card that changed... },
       "response": "Your in-character response string here"
     }
     Return ONLY the JSON object. Do not wrap in markdown.
     `;
 
     const response = await c.env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
       messages: [
         { role: 'system', content: systemPrompt },
         ...messages
       ]
     });

     console.log(response.response);  
     
     return c.json(JSON.parse(response.response));
  } catch (error: any) {
     return c.json({ error: error.message }, 500);
  }
})

export default app
