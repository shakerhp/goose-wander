import Ably from "ably";

const apiKey = process.env.ABLY_API_KEY;

if (!apiKey) {
  throw new Error("Missing Ably API key.");
}

export const ablyRest = new Ably.Rest(apiKey);
