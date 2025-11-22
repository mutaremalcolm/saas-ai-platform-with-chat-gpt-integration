/* instabul ignore file */

"use client";

import axios from "axios";
import * as z from "zod";
import { Heading } from "@/components/heading";
import { MusicIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Empty } from "@/components/empty";
import { Loader } from "@/components/loader";
import { useProModal } from "@/hooks/use-pro-modal";
import toast from "react-hot-toast";

// Define the form schema for audio generation
const formSchema = z.object({
  prompt: z.string().min(1, {
    message: "Audio prompt is required.",
  }),
  model_version: z.string().optional(),
  output_format: z.string().optional(),
  normalization_strategy: z.string().optional()
});

const AudioPage = () => {
  const router = useRouter();
  const proModal = useProModal();
  const [audio, setAudio] = useState<string>();
  const [error, setError] = useState<string>();
  const [debugInfo, setDebugInfo] = useState<string>();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      model_version: "stereo-large",
      output_format: "mp3",
      normalization_strategy: "peak"
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setAudio(undefined);
      setError(undefined);
      setDebugInfo(undefined);

      const response = await axios.post("/api/music", values);
      
      console.log("Full response:", response);
      console.log("Response data:", response.data);
      
      if (response.data?.url) {
        setAudio(response.data.url);
        setDebugInfo(`Audio URL: ${response.data.url}`);
      } else {
        console.error("Unexpected response format:", response.data);
        setDebugInfo(`Unexpected response format: ${JSON.stringify(response.data)}`);
        throw new Error('Invalid audio response format');
      }

      form.reset();
      
    } catch (error: any) {
      console.error("Full error object:", error);
      
      let errorMessage = "Something went wrong generating the audio";
      
      if (error?.response?.status === 403) {
        proModal.onOpen();
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
        setDebugInfo(`Server Error Details: ${error.response.data.details || 'No details provided'}`);
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      router.refresh();
    }
  };

  return (
    <div>
      <Heading
        title="Audio Generation"
        description="Turn your prompt into audio"
        icon={MusicIcon}
        iconColor="text-emerald-500"
        bgColor="bg-emerald-500/10"
      />
      <div className="px-4 lg:px-8">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="
                rounded-lg
                border
                w-full
                p-4
                px-3
                md:px-6
                focus-within:shadow-sm
                grid
                grid-cols-12
                gap-2
              "
            >
              <FormField
                name="prompt"
                render={({ field }) => (
                  <FormItem className="col-span-12 lg:col-span-10">
                    <FormControl className="m-0 p-0">
                      <Input
                        className="border-0 outline-none 
                                    focus-visible:ring-0
                                    focus-visible:ring-transparent"
                        disabled={isLoading}
                        placeholder="Generate triumphant cinematic music with crescendo"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button 
                className="col-span-12 lg:col-span-2 w-full" 
                disabled={isLoading}
              >
                Generate
              </Button>
            </form>
          </Form> 
          <div className="space-y-4 mt-4">
          {isLoading && (
            <div className="p-8 rounded-lg w-full flex items-center justify-center bg-muted">
              <Loader />
            </div>
          )}
          {!audio && !isLoading && !error && (
            <Empty label="No audio generated"/>
          )}
          {error && (
            <div className="p-4 rounded-lg w-full bg-red-50 border border-red-200">
              <p className="text-red-800">{error}</p>
              {debugInfo && (
                <p className="mt-2 text-sm text-red-600">{debugInfo}</p>
              )}
            </div>
          )}
          {audio && (
            <div className="p-4 rounded-lg w-full bg-white shadow">
              <audio
                controls
                className="w-full"
                key={audio}
                onError={(e) => {
                  console.error("Audio playback error:", e);
                  setError("Failed to play audio. Please try again.");
                  setDebugInfo(`Attempted to play: ${audio}`);
                }}
                autoPlay={false}
              >
                <source src={audio} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
              {debugInfo && (
                <p className="mt-2 text-sm text-gray-500">{debugInfo}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default AudioPage;