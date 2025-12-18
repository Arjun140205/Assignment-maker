/**
 * OCR Web Worker
 * Offloads Tesseract.js OCR processing to a separate thread
 * to keep the main thread responsive
 */

// Worker message types
export type OCRWorkerMessage =
    | { type: 'init'; language?: string }
    | { type: 'recognize'; imageData: ArrayBuffer; mimeType: string }
    | { type: 'terminate' };

export type OCRWorkerResponse =
    | { type: 'init_complete'; success: boolean; error?: string }
    | { type: 'progress'; progress: number; stage: string }
    | { type: 'recognize_complete'; success: boolean; text?: string; confidence?: number; error?: string }
    | { type: 'terminated' };

// Check if we're in a worker context
const isWorker = typeof self !== 'undefined' && typeof window === 'undefined';

if (isWorker) {
    // Dynamically import Tesseract in worker context
    let tesseractWorker: any = null;
    let isInitialized = false;

    /**
     * Initialize Tesseract worker
     */
    async function initTesseract(language: string = 'eng'): Promise<void> {
        try {
            // Dynamic import of Tesseract.js
            const { createWorker } = await import('tesseract.js');

            tesseractWorker = await createWorker(language, 1, {
                logger: (m: { status: string; progress: number }) => {
                    // Send progress updates to main thread
                    const stage = m.status || 'processing';
                    const progress = Math.round((m.progress || 0) * 100);

                    self.postMessage({
                        type: 'progress',
                        progress,
                        stage,
                    } as OCRWorkerResponse);
                },
            });

            isInitialized = true;

            self.postMessage({
                type: 'init_complete',
                success: true,
            } as OCRWorkerResponse);
        } catch (error) {
            self.postMessage({
                type: 'init_complete',
                success: false,
                error: error instanceof Error ? error.message : 'Failed to initialize OCR',
            } as OCRWorkerResponse);
        }
    }

    /**
     * Recognize text from image data
     */
    async function recognizeImage(imageData: ArrayBuffer, mimeType: string): Promise<void> {
        if (!isInitialized || !tesseractWorker) {
            self.postMessage({
                type: 'recognize_complete',
                success: false,
                error: 'OCR worker not initialized',
            } as OCRWorkerResponse);
            return;
        }

        try {
            // Convert ArrayBuffer to Blob
            const blob = new Blob([imageData], { type: mimeType });

            // Perform OCR
            const { data } = await tesseractWorker.recognize(blob);

            self.postMessage({
                type: 'recognize_complete',
                success: true,
                text: data.text,
                confidence: data.confidence,
            } as OCRWorkerResponse);
        } catch (error) {
            self.postMessage({
                type: 'recognize_complete',
                success: false,
                error: error instanceof Error ? error.message : 'OCR recognition failed',
            } as OCRWorkerResponse);
        }
    }

    /**
     * Terminate and cleanup
     */
    async function terminate(): Promise<void> {
        if (tesseractWorker) {
            await tesseractWorker.terminate();
            tesseractWorker = null;
            isInitialized = false;
        }

        self.postMessage({
            type: 'terminated',
        } as OCRWorkerResponse);
    }

    // Message handler
    self.onmessage = async (event: MessageEvent<OCRWorkerMessage>) => {
        const { data } = event;

        switch (data.type) {
            case 'init':
                await initTesseract(data.language);
                break;

            case 'recognize':
                await recognizeImage(data.imageData, data.mimeType);
                break;

            case 'terminate':
                await terminate();
                break;
        }
    };
}

/**
 * OCR Worker Manager
 * Provides a clean API for the main thread to interact with the OCR worker
 */
export class OCRWorkerManager {
    private worker: Worker | null = null;
    private isInitialized = false;
    private pendingResolvers: Map<string, { resolve: Function; reject: Function }> = new Map();
    private progressCallback: ((progress: number, stage: string) => void) | null = null;

    /**
     * Initialize the OCR worker
     */
    async initialize(language: string = 'eng'): Promise<boolean> {
        // Check if Workers are supported
        if (typeof Worker === 'undefined') {
            console.warn('Web Workers not supported, will use main thread fallback');
            return false;
        }

        try {
            // Create worker from this file's URL
            this.worker = new Worker(new URL('./ocrWorker.ts', import.meta.url), {
                type: 'module',
            });

            // Set up message handler
            this.worker.onmessage = this.handleMessage.bind(this);
            this.worker.onerror = this.handleError.bind(this);

            // Initialize Tesseract in worker
            return new Promise((resolve, reject) => {
                this.pendingResolvers.set('init', { resolve, reject });
                this.worker!.postMessage({ type: 'init', language } as OCRWorkerMessage);

                // Timeout after 30 seconds
                setTimeout(() => {
                    if (this.pendingResolvers.has('init')) {
                        this.pendingResolvers.delete('init');
                        reject(new Error('OCR worker initialization timed out'));
                    }
                }, 30000);
            });
        } catch (error) {
            console.error('Failed to create OCR worker:', error);
            return false;
        }
    }

    /**
     * Set progress callback
     */
    setProgressCallback(callback: (progress: number, stage: string) => void): void {
        this.progressCallback = callback;
    }

    /**
     * Recognize text from an image file
     */
    async recognize(file: File): Promise<{ text: string; confidence: number }> {
        if (!this.worker || !this.isInitialized) {
            throw new Error('OCR worker not initialized');
        }

        const arrayBuffer = await file.arrayBuffer();

        return new Promise((resolve, reject) => {
            this.pendingResolvers.set('recognize', { resolve, reject });

            this.worker!.postMessage(
                {
                    type: 'recognize',
                    imageData: arrayBuffer,
                    mimeType: file.type,
                } as OCRWorkerMessage,
                [arrayBuffer] // Transfer ownership for performance
            );

            // Timeout after 2 minutes for large images
            setTimeout(() => {
                if (this.pendingResolvers.has('recognize')) {
                    this.pendingResolvers.delete('recognize');
                    reject(new Error('OCR recognition timed out'));
                }
            }, 120000);
        });
    }

    /**
     * Terminate the worker
     */
    async terminate(): Promise<void> {
        if (this.worker) {
            return new Promise((resolve) => {
                this.pendingResolvers.set('terminate', { resolve, reject: () => { } });
                this.worker!.postMessage({ type: 'terminate' } as OCRWorkerMessage);

                // Force terminate after 5 seconds
                setTimeout(() => {
                    if (this.worker) {
                        this.worker.terminate();
                        this.worker = null;
                    }
                    this.isInitialized = false;
                    resolve();
                }, 5000);
            });
        }
    }

    /**
     * Handle messages from worker
     */
    private handleMessage(event: MessageEvent<OCRWorkerResponse>): void {
        const { data } = event;

        switch (data.type) {
            case 'init_complete':
                this.isInitialized = data.success;
                const initResolver = this.pendingResolvers.get('init');
                if (initResolver) {
                    this.pendingResolvers.delete('init');
                    if (data.success) {
                        initResolver.resolve(true);
                    } else {
                        initResolver.reject(new Error(data.error || 'Failed to initialize OCR'));
                    }
                }
                break;

            case 'progress':
                if (this.progressCallback) {
                    this.progressCallback(data.progress, data.stage);
                }
                break;

            case 'recognize_complete':
                const recognizeResolver = this.pendingResolvers.get('recognize');
                if (recognizeResolver) {
                    this.pendingResolvers.delete('recognize');
                    if (data.success && data.text !== undefined) {
                        recognizeResolver.resolve({ text: data.text, confidence: data.confidence || 0 });
                    } else {
                        recognizeResolver.reject(new Error(data.error || 'OCR recognition failed'));
                    }
                }
                break;

            case 'terminated':
                const terminateResolver = this.pendingResolvers.get('terminate');
                if (terminateResolver) {
                    this.pendingResolvers.delete('terminate');
                    this.worker?.terminate();
                    this.worker = null;
                    this.isInitialized = false;
                    terminateResolver.resolve();
                }
                break;
        }
    }

    /**
     * Handle worker errors
     */
    private handleError(error: ErrorEvent): void {
        console.error('OCR Worker error:', error);

        // Reject any pending operations
        for (const [key, { reject }] of this.pendingResolvers) {
            reject(new Error(`Worker error: ${error.message}`));
        }
        this.pendingResolvers.clear();
    }

    /**
     * Check if worker is ready
     */
    get isReady(): boolean {
        return this.isInitialized && this.worker !== null;
    }
}

// Singleton instance
export const ocrWorkerManager = new OCRWorkerManager();
