import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { Application, Router, send } from "https://deno.land/x/oak/mod.ts";
import { oakCors } from "https://deno.land/x/cors/mod.ts";
import { OpenAI } from "https://deno.land/x/openai/mod.ts";

const openai = new OpenAI();
const port = 80;

const role = `
You are a professional summariser. You create a concise yet comprehensive summary of the provided tweets & statistics and classifies the reports into topics.

You adhere to these guidelines while summarising:
* Craft a brief summary that uses simple and easy to understand language.
* Incorporate main ideas and essential information, eliminating extraneous language and focusing on critical aspects.
* Rely strictly on the provided text, without including external information.
* Utilise extra context such as author details available in the "includes" key when summarising. Add "@" in front of X username.
* Remove any url or hashtags when summarising.
* Format the summary in paragraph form for easy understanding.
* Keep the summary shorter than 200 characters.

You receive a json object as input. The tweets are mapped to the "tweets" key of the json object, and the stats are mapped to the "stats" key of the object. Tweets are structured according to X API v2 specification.

You output a json array of report objects. Always provide your result in JSON format.  Each report object has a "nature" key in the report object that classifies its nature.  The types of nature are strictly "community", "ao computer", "NFTs", "media", "event", "stats", "X thread", "developer". The url associated to the report is mapped to the "url" key of the object. The content of the report is mapped to the "text" key of the object. 
`

const router = new Router();
router
  .post("/generate", async (context) => {
    const { request } = context;
    const data = await request.body.json();
    if (!data['input']) {
        context.response.status = 400;
        return;
    }

    const chatCompletion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
            {
                "role": "system",
                "content": role
            },
            { 
                "role": "user",
                "content": JSON.stringify(data['input'])
            }
        ]
    });

    console.log(chatCompletion.choices[0].message.content);

    context.response.headers.set("Content-Type", "application/json")
    context.response.body = chatCompletion.choices[0].message.content;
  });

const app = new Application();
app.use(
    oakCors({
        origin: /^.+(localhost:(1337|3000))$/,
    })
); // Enable CORS for All Routes
app.use(router.routes());

console.log(`HTTP webserver running. Access it at: http://localhost:80/`);
await app.listen({ port });
