
import { HardwareState, ActiveProcess } from "../types";

export const detectHardware = (): HardwareState => {
    // 1. CPU Detection
    const cores = navigator.hardwareConcurrency || 4; // Logical cores
    
    // 2. RAM Detection (Approximate)
    // @ts-ignore
    const totalRam = (navigator as any).deviceMemory || 8; 
    
    // 3. GPU Detection via WebGL
    let renderer = "Generic GPU";
    let vendor = "Unknown";
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                vendor = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            }
        }
    } catch (e) { console.error("GPU Detect Failed", e); }

    // 4. OS Detection (Enhanced)
    const ua = navigator.userAgent;
    let os = "Unknown OS";
    
    // Check for iOS
    if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
        os = "iOS (Darwin Kernel)";
    }
    // Check for macOS
    else if (/Macintosh|Mac OS X/.test(ua)) {
        os = "macOS (XNU/Darwin)";
    }
    // Check for Android
    else if (/Android/.test(ua)) {
        os = "Android (Linux Kernel)";
    }
    // Check for Windows
    else if (/Win/.test(ua)) {
        os = "Windows (NT Kernel)";
    }
    // Check for Linux
    else if (/Linux/.test(ua)) {
        os = "GNU/Linux";
    }

    return {
        gpu: {
            renderer,
            vendor,
            vramEstimated: 4096, // Start estimation
            load: 0,
            temperature: 45 // Start temp
        },
        cpu: {
            cores,
            usage: 0,
            processCount: 0
        },
        ram: {
            total: totalRam,
            used: totalRam * 0.4, 
            browserHeap: 0
        },
        os,
        userAgent: ua,
        fanSpeed: 0
    };
};

export const pollMetrics = (currentState: HardwareState): HardwareState => {
    const time = Date.now();
    const noise = Math.sin(time / 2000) * 10 + Math.cos(time / 500) * 5;
    
    // Get Real Browser Heap if available
    let heapUsed = 0;
    // @ts-ignore
    if (performance && performance.memory) {
        // @ts-ignore
        heapUsed = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
    }

    // CPU fluctuation
    const newCpuUsage = Math.max(5, Math.min(100, 15 + noise)); 
    
    // RAM fluctuation
    const newRamUsed = Math.max(0, Math.min(currentState.ram.total, (currentState.ram.total * 0.4) + (noise / 100)));

    // GPU Simulation Logic
    const gpuLoadTarget = newCpuUsage * 1.2 + (Math.random() * 10);
    const newGpuLoad = Math.max(0, Math.min(100, gpuLoadTarget));
    
    // Thermal Simulation
    const targetTemp = 40 + (newGpuLoad / 100) * 45;
    const newTemp = currentState.gpu.temperature + (targetTemp - currentState.gpu.temperature) * 0.05;
    
    // Fan Curve
    const newFanSpeed = newTemp > 60 ? (newTemp - 60) * 100 : 0; // RPM offset

    // VRAM Simulation (MB)
    const vram = 500 + (newGpuLoad * 20) + Math.random() * 50;

    return {
        ...currentState,
        gpu: { 
            ...currentState.gpu, 
            load: newGpuLoad,
            temperature: newTemp,
            vramEstimated: Math.floor(vram)
        },
        cpu: { ...currentState.cpu, usage: newCpuUsage, processCount: 140 + Math.floor(noise) },
        ram: { ...currentState.ram, used: newRamUsed, browserHeap: heapUsed },
        fanSpeed: Math.floor(1000 + newFanSpeed)
    };
};

export const getKernelProcesses = (): ActiveProcess[] => {
    return [
        { id: 'k1', name: 'System Interrupts', type: 'KERNEL', progress: 100 },
        { id: 'k2', name: 'Registry Broker', type: 'IO', progress: 100 },
        { id: 'k3', name: 'Hyperbit Render Engine', type: 'BACKGROUND', progress: 100 },
        { id: 'k4', name: 'Muza.app (Consciousness)', type: 'THOUGHT', progress: Math.random() * 100 },
        { id: 'k5', name: 'Memory Compression', type: 'KERNEL', progress: 100 },
    ];
};
