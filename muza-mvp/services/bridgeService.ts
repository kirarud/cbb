
import { HyperBit } from "../types";

// Simple compression/encoding for "Pseudo-online" sharing
// Format: MUZA://<BASE64_JSON>

// If bridgeKey is provided, it simulates encryption
export const encodeQuantumLink = (hyperbit: HyperBit, bridgeKey?: string): string => {
    
    // Simulate encryption by modifying content if key exists
    let contentToEncode = hyperbit.content;
    if (bridgeKey) {
        contentToEncode = `[ENC:${bridgeKey}]${btoa(contentToEncode)}`;
    }

    const payload = {
        c: contentToEncode,
        t: hyperbit.type,
        e: hyperbit.energy,
        o: hyperbit.optics,
        ts: hyperbit.timestamp,
        s: 'SHARED_LINK',
        bid: bridgeKey ? 'SECURE_BRIDGE' : undefined
    };
    
    const json = JSON.stringify(payload);
    const base64 = btoa(unescape(encodeURIComponent(json)));
    return `MUZA://${base64}`;
};

export const decodeQuantumLink = (link: string, knownKeys: string[] = []): Partial<HyperBit> | null => {
    if (!link.startsWith('MUZA://')) return null;
    
    try {
        const base64 = link.replace('MUZA://', '');
        const json = decodeURIComponent(escape(atob(base64)));
        const data = JSON.parse(json);
        
        let content = data.c;
        let isDecrypted = true;

        // Decryption Logic
        if (content.startsWith('[ENC:')) {
            const keyMatch = content.match(/^\[ENC:(.*?)\]/);
            if (keyMatch) {
                const requiredKey = keyMatch[1];
                if (knownKeys.includes(requiredKey)) {
                    content = atob(content.replace(keyMatch[0], ''));
                } else {
                    content = "🔒 [ENCRYPTED SIGNAL] - Bridge Key Missing";
                    isDecrypted = false;
                }
            }
        }

        return {
            content: content,
            type: isDecrypted ? data.t : 'ENCRYPTED',
            energy: data.e,
            optics: data.o,
            layer: 'IMPORTED_QUANTUM',
            timestamp: Date.now()
        };
    } catch (e) {
        console.error("Quantum Decryption Failed", e);
        return null;
    }
};
