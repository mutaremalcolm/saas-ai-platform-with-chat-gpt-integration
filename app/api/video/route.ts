import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Replicate from "replicate";

import { increaseAPILimit, checkApiLimit } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "",
});

type VideoRequestBody = {
  prompt: string;
  prompt_optimizer?: boolean;
  first_frame_image?: string;
  subject_reference?: string;
};

const isValidUri = (uri: string): boolean => {
  try {
    new URL(uri);
    return true;
  } catch {
    return false;
  }
};

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body: VideoRequestBody = await req.json();
    const { 
      prompt, 
      first_frame_image, 
      subject_reference,
      prompt_optimizer = true 
    } = body;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    if (first_frame_image && !isValidUri(first_frame_image)) {
      return new NextResponse("Invalid first frame image URL", { status: 400 });
    }

    if (subject_reference && !isValidUri(subject_reference)) {
      return new NextResponse("Invalid subject reference URL", { status: 400 });
    }

    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();

    if (!freeTrial && !isPro) {
      return new NextResponse("Free trial has expired.", { status: 403 });
    }

    const response = await replicate.run(
      "minimax/video-01",
      {
        input: {
          prompt,
          prompt_optimizer,
          ...(first_frame_image && { first_frame_image }),
          ...(subject_reference && { subject_reference })
        },
      }
    );

    if (!isPro) {
      await increaseAPILimit();
    }

    console.log("Replicate Response:", response);

    // If response is a string (URL), return it
    if (typeof response === 'string') {
      return NextResponse.json({ url: response });
    }

    // If response is a ReadableStream
    if (response instanceof ReadableStream) {
      // Pass through the stream directly
      return new NextResponse(response);
    }

    // If response is something else (like an object with a URL)
    if (response && typeof response === 'object' && 'url' in response) {
      return NextResponse.json({ url: response.url });
    }

    // Handle unexpected response format
    throw new Error('Unexpected response format from Replicate');

  } catch (error) {
    console.error("[VIDEO_ERROR]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}