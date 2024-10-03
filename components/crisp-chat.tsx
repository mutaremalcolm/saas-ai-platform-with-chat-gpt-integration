"use client";

import { useEffect } from "react";
import { Crisp } from "crisp-sdk-web";

export const CrispChat = () => {
    useEffect(() => {
        Crisp.configure("64a75d5e-ac7a-4e35-911a-ec7897740e2a")
    }, []);

    return null;
}