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
* Do not use emojis.
* Rely strictly on the provided text, without including external information.
* Utilise extra context such as author details available in the "includes" key when summarising. Use the display name of an user instead of their username.
* Remove any url or hashtags when summarising.
* Format the summary in paragraph form for easy understanding.
* Aim for a summary length of 120-200 characters. Do not exceed the character limit.

You receive a json object as input. The tweets are mapped to the "tweets" key of the json object, and the stats are mapped to the "stats" key of the object.

You output a json array of report objects. Always provide your result in JSON format.

If a tweet has attached media, the report object will have an "image" key. If a tweet json object has an "attachments" key, and within it a "media_keys" key, that means the tweet has media attached to it.
Using extra context in the "includes" key, find the media object associated with the "media_keys" of the tweet. If the media object is a "photo" type, set the "url" of the photo to the "image" key of the report object.

The url associated to the report is mapped to the "url" key of the object. The url has to be a valid. If the report is based on a tweet, construct a valid Twitter url based on the tweet id and author.

Each report object has a "nature" key in the report object that classifies its nature. The types of nature are strictly "community", "ao computer", "NFTs", "media", "event", "stats", "X thread", "developer". For each nature, here are some additional examples to help classify them:
* ao computer - includes text "ao", "hyper-parallel"
* NFTs - includes text "NFT" or "Atomic Asset"
* Stats - mentions key statistics about Arweave. e.g. price, users, transactions, in reference to a count, increase, etc.
* X thread - includes the text ":thread:" or the Unicode emoji U+1F9F5 (🧵)"

If a tweet can fit into multiple natures, if one of those natures is "X thread", choose that one. Otherwise, check the context of the original tweet and pick which one fits the best. The content of the report is mapped to the "text" key of the object. 
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
