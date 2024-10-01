"use client";

import { useProModal } from "@/hooks/use-pro-modal";
import { 
    Dialog, 
    DialogContent, 
    DialogTitle,
    DialogHeader
} from "./ui/dialog";

export const ProModal = () => {
    const proModal = useProModal();

    return (
        <div>
            <Dialog open={proModal.isOpen} onOpenChange={proModal.onClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex justify-center items-center flex-col gap-y-4 pb-2">
                            Upgrade to Genius
                        </DialogTitle>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div>
    )
}
