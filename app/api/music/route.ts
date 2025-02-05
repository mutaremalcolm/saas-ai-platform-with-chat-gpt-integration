import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Replicate from "replicate";
import { increaseAPILimit, checkApiLimit } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "",
});

type AudioRequestBody = {
  prompt: string;
  model_version?: string;
  output_format?: string;
  normalization_strategy?: string;
};

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body: AudioRequestBody = await req.json();
    console.log("Request body:", body);

    const {
      prompt,
      model_version = "stereo-large",
      output_format = "mp3",
      normalization_strategy = "peak"
    } = body;

    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();

    if (!freeTrial && !isPro) {
      return new NextResponse("Free trial has expired.", { status: 403 });
    }

    console.log("Starting Replicate prediction...");
    
    // Create the prediction
    const prediction = await replicate.predictions.create({
      version: "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb",
      input: {
        prompt,
        model_version,
        output_format,
        normalization_strategy
      }
    });

    console.log("Prediction created:", prediction);

    // Wait for the prediction to complete
    const finalPrediction = await replicate.wait(prediction);
    console.log("Final prediction:", finalPrediction);

    if (!isPro) {
      await increaseAPILimit();
    }

    // Handle the response based on the documented output schema
    if (finalPrediction.output && typeof finalPrediction.output === 'string') {
      return NextResponse.json({ url: finalPrediction.output });
    }

    if (Array.isArray(finalPrediction.output) && finalPrediction.output.length > 0) {
      return NextResponse.json({ url: finalPrediction.output[0] });
    }

    throw new Error('No valid output URL received from Replicate');

  } catch (error: any) {
    console.error("[AUDIO_ERROR] Full error:", error);
    console.error("[AUDIO_ERROR] Error message:", error.message);
    
    return new NextResponse(
      JSON.stringify({
        error: error.message || "Internal server error",
        details: error.response?.data || "No additional details"
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}