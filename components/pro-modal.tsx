"use client";

import { useProModal } from "@/hooks/use-pro-modal";
import { 
    Dialog, 
    DialogContent, 
    DialogTitle,
    DialogHeader,
    DialogDescription,
    DialogFooter
} from "./ui/dialog";

import { 
    Check,
    Code, 
    ImageIcon, 
    MessageSquare, 
    Music, 
    VideoIcon, 
    Zap
} from "lucide-react";

import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";

const tools = [
    {
      label: "Conversation",
      icon: MessageSquare,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
    {
      label: "Music Generation",
      icon: Music,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Image Generation",
      icon: ImageIcon,
      color: "text-pink-700",
      bgColor: "bg-pink-700/10",
    },
    {
      label: "Video Generation",
      icon: VideoIcon,
      color: "text-orange-700",
      bgColor: "bg-orange-700/10",
    },
    {
      label: "Code Generation",
      icon: Code,
      color: "text-green-700",
      bgColor: "bg-green-700/10",
    }
]

export const ProModal = () => {
    const proModal = useProModal();
    const [loading, setLoading] = useState(false);

    const onSubscribe = async () => {
        try {
            setLoading(true);
            const response = axios.get("/api/stripe");
            window.location.href = (await response).data.url;

        }catch (error) {
            toast.error("Something went wrong");
        }finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <Dialog open={proModal.isOpen} onOpenChange={proModal.onClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex justify-center items-center flex-col gap-y-4 pb-2">
                            <div className="flex items-center gap-x-2 font-bold py-1">
                            Upgrade to Genius
                            <Badge variant="premium" className="uppercase text-sm py-1">
                                pro
                            </Badge>
                            </div>
                        </DialogTitle>
                        <DialogDescription className="text-center pt-2 space-y-2 text-zinc-900 font-medium">
                            <Card className="p-4 border-yellow-500/20 bg-yellow-50 mb-4">
                                <p className="text-sm text-yellow-800">
                                    Heads up, your friendly developer Malcolm here. Stripe is still in test mode therefore the process to upgrade will be simulated. Please use the following on the card details:
                                </p>
                                <div className="mt-2 text-sm text-yellow-700 font-mono">
                                    Card Number: 4444 4444 4444 4444<br/>
                                    CCV: 444<br/>
                                    Date of expiry: any future date beyond today
                                </div>
                            </Card>
                            {tools.map((tool) => (
                                <Card
                                    key={tool.label}
                                    className="p-3 border-black/5 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-x-4">
                                        <div className={cn("p-2 w-fit rounded-md", tool.bgColor)}>
                                            <tool.icon className={cn("w-6 h-6", tool.color)} />
                                        </div>
                                        <div className="font-semibold text-sm">
                                            {tool.label}
                                        </div>
                                    </div>
                                    <Check className="text-primary w-5 h-5"/>
                                </Card>
                            ))}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            disabled={loading}
                            onClick={onSubscribe}
                            size="lg"
                            variant="premium"
                            className="w-full"
                        >
                            Upgrade
                            <Zap className="w-4 h-4 ml-2 fill-white"/>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}